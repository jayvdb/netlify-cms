import Ember from 'ember';
import Cache from './object_cache/cache';
import GithubAPI from '../backends/github_api';

export default Ember.Object.extend({
  init: function() {
    this.fileCache = Cache.create({});
  },

  /**
    Configure the repository.

    Gets the global CMS config and the credentials from the authenticator.

    TODO: Handle bad credentials (users github account doesn't have access to the
    repo specified in the config).

    @method configure
    @param {Config} config
    @param {Object} credentials
  */
  configure: function(config, credentials) {
    this.backend = new GithubAPI(config, credentials);
  },

  /**
    Used when logging out. Makes sure the repository settings is reset and that
    the current in memory repo can longer be used to make calls to the repo API.

    @method reset
  */
  reset: function() {
    this.backend = null;
  },

  /**
    Read the files from a specific path of the repository

    @method listFiles
    @param {String} path
    @return {Promise} files
  */
  listFiles: function(path) {
    return this.backend.listFiles(path);
  },

  /**
    Read the content of a file.

    If an optional sha is specified, the content will be read from the local cache
    if present.

    @method readFile
    @param {String} path
    @param {String} sha
    @return {Promise} content
  */
  readFile: function(path, sha) {
    if (sha) {
      return this.fileCache.get(sha).then(function(content) {
        return content;
      }, function() {
        return this.backend.readFile(path).then(function(content) {
          this.fileCache.set(sha, content);
          return content;
        }.bind(this));
      }.bind(this));
    } else {
      return this.backend.readFile(path);
    }
  },

  /**
    Takes a list of files that should be updated in the repository. Will also fetch
    any uploads in the media store and add them to the commit.

    Each file must be a {path, content} object.

    Only option at this point is a `message` that will be used as the commit message.

    @method updateFiles
    @param {Array} files
    @param {Object} options
    @return {Promise} response
  */
  updateFiles: function(files, options) {
    var media = this.get("media");
    var uploads = (files || []).concat(media.get("uploads"));

    return this.backend.updateFiles(uploads);
  }
});
