const { Meta, Gtk, Gio, GLib, St, Shell } = imports.gi;

const Main = imports.ui.main;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

function createIcon(mimeType, size) {
    let symbolicIcon = mimeType ? Gio.content_type_get_symbolic_icon(mimeType)?.to_string() : null;
    return symbolicIcon
        ? new St.Icon({ gicon: Gio.icon_new_for_string(symbolicIcon), icon_size: size })
        : new St.Icon({ icon_name: 'icon-missing', icon_size: size });
}

var RecentFilesSearchProvider = class {
    constructor(recentFilesManager) {
        this.id = 'arcmenu.recent-files';
        this.isRemoteProvider = true;
        this.canLaunchSearch = false;
        this.recentFilesManager = recentFilesManager;

        this._recentFiles = [];

        this.appInfo = {
            get_description: () => _('Recent Files'),
            get_name: () => _('Recent Files'),
            get_id: () => 'arcmenu.recent-files',
            get_icon: () => Gio.icon_new_for_string('document-open-recent-symbolic'),
        }
    }

    getResultMetas(fileUris) {
        const metas = fileUris.map(fileUri => {
            const rf = this._getRecentFile(fileUri);
            const file = Gio.File.new_for_uri(rf.get_uri());
            return rf ? {
                id: fileUri,
                name: rf.get_display_name(),
                description: file.get_parent()?.get_path(), // can be null
                createIcon: (size) => createIcon(rf.get_mime_type(), size),
            } : undefined;
        }).filter(m => m?.name !== undefined && m?.name !== null);

        return new Promise(resolve => resolve(metas));
    }

    filterResults(results, maxNumber) {
        return results.slice(0, maxNumber);
    }

    async getInitialResultSet(terms, cancellable) {
        this.recentFilesManager.cancelCurrentQueries();
        this._recentFiles = [];

        let promises = this.recentFilesManager.createQueryPromises();

        await Promise.allSettled(promises)
        .then(results => {
            if(results.length === 0)
                return this._recentFiles;

            results.forEach(result => {
                if(result.status === 'fulfilled' && result.value)
                    this._recentFiles.push(result.value);    
            });
        });
        return this._getFilteredFileUris(terms, this._recentFiles);
    }

    getSubsearchResultSet(previousResults, terms, cancellable) {
        return this.getInitialResultSet(terms, cancellable);
    }

    activateResult(fileUri, _terms) {
        const recentFile = this._getRecentFile(fileUri);
        if (recentFile){
            let context = global.create_app_launch_context(0, -1);

            new Promise((resolve, reject) => {
                Gio.AppInfo.launch_default_for_uri_async(recentFile.get_uri(), context, null, (o, res) => {
                    try {
                        Gio.AppInfo.launch_default_for_uri_finish(res);
                        resolve();
                    } catch (e) {
                        Main.notifyError(_('Failed to open “%s”').format(recentFile.get_display_name()), e.message);
                        reject(e);
                    }
                });
            });
        }
    }

    launchSearch() {
    }

    _getFilteredFileUris(terms, recentFiles) {
        terms = terms.map(term => term.toLowerCase());
        recentFiles = recentFiles.filter(rf => {
            const fileName = rf.get_display_name()?.toLowerCase();
            return terms.some(term => fileName?.includes(term));
        });

        return recentFiles.map(rf => rf.get_uri());
    }

    _getRecentFile(fileUri) {
        return this._recentFiles.find(rf => rf.get_uri() === fileUri);
    }
}