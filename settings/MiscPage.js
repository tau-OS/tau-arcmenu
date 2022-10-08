const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const {Adw, Gio, GLib, GObject, Gtk} = imports.gi;
const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const Prefs = Me.imports.prefs;
const PW = Me.imports.prefsWidgets;
const _ = Gettext.gettext;

const SCHEMA_PATH = '/org/gnome/shell/extensions/arcmenu/';
const GSET = 'gnome-shell-extension-tool';

var MiscPage = GObject.registerClass(
class ArcMenu_MiscPage extends Adw.PreferencesPage {
    _init(settings, preferencesWindow) {
        super._init({
            title: _('Misc'),
            icon_name: 'settings-misc-symbolic',
            name: "MiscPage"
        });
        this._settings = settings;

        let importFrame = new Adw.PreferencesGroup({
            title: _('Export or Import Settings')
        });
        let importRow = new Adw.ActionRow({
            title: _("ArcMenu Settings")
        });
        let settingsImportInfoButton = new PW.Button({
            icon_name: 'help-about-symbolic'
        });
        settingsImportInfoButton.connect('clicked', () => {
            let dialog = new Gtk.MessageDialog({
                text: "<b>" + _("Export or Import ArcMenu Settings") + '</b>',
                secondary_text:_('Importing will overwrite current settings.'),
                use_markup: true,
                buttons: Gtk.ButtonsType.OK,
                message_type: Gtk.MessageType.WARNING,
                transient_for: this.get_root(),
                modal: true
            });
            dialog.connect('response', (widget, response) => {
                dialog.destroy();
            });
            dialog.show();
        });

        let importButton = new Gtk.Button({
            label: _("Import"),
            valign: Gtk.Align.CENTER
        });
        importButton.connect('clicked', () => {
            this._showFileChooser(
                _('Import settings'),
                { action: Gtk.FileChooserAction.OPEN },
                "_Open",
                filename => {
                    if (filename && GLib.file_test(filename, GLib.FileTest.EXISTS)) {
                        let settingsFile = Gio.File.new_for_path(filename);
                        let [ success_, pid, stdin, stdout, stderr] =
                            GLib.spawn_async_with_pipes(
                                null,
                                ['dconf', 'load', SCHEMA_PATH],
                                null,
                                GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD,
                                null
                            );

                        stdin = new Gio.UnixOutputStream({ fd: stdin, close_fd: true });
                        GLib.close(stdout);
                        GLib.close(stderr);

                        stdin.splice(settingsFile.read(null), Gio.OutputStreamSpliceFlags.CLOSE_SOURCE | Gio.OutputStreamSpliceFlags.CLOSE_TARGET, null);

                        Prefs.populateWindow(preferencesWindow, this._settings);
                    }
                }
            );
        });
        let exportButton = new Gtk.Button({
            label: _("Export"),
            valign: Gtk.Align.CENTER
        });
        exportButton.connect('clicked', () => {
            this._showFileChooser(
                _('Export settings'),
                { action: Gtk.FileChooserAction.SAVE},
                "_Save",
                (filename) => {
                    let file = Gio.file_new_for_path(filename);
                    let raw = file.replace(null, false, Gio.FileCreateFlags.NONE, null);
                    let out = Gio.BufferedOutputStream.new_sized(raw, 4096);
                    out.write_all(GLib.spawn_command_line_sync('dconf dump ' + SCHEMA_PATH)[1], null);
                    out.close(null);
                }
            );
        });
        importRow.add_suffix(importButton);
        importRow.add_suffix(exportButton);
        importRow.add_suffix(settingsImportInfoButton);
        importFrame.add(importRow);
        this.add(importFrame);

        let settingsSizeFrame = new Adw.PreferencesGroup({
            title: _('ArcMenu Settings Window Size')
        });
        let settingsWidthScale = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 500, upper: 1800, step_increment: 1, page_increment: 1, page_size: 0,
            }),
            climb_rate: 1,
            digits: 0,
            numeric: true,
            valign: Gtk.Align.CENTER
        });
        settingsWidthScale.set_value(this._settings.get_int("settings-width"));
        settingsWidthScale.connect('value-changed', (widget) => {
            this._settings.set_int("settings-width", widget.get_value());
        });
        let settingsWidthRow = new Adw.ActionRow({
            title: _('Window Width'),
            activatable_widget: settingsWidthScale
        });
        settingsWidthRow.add_suffix(settingsWidthScale);
        settingsSizeFrame.add(settingsWidthRow);

        let settingsHeightScale = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 300, upper: 1600, step_increment: 1, page_increment: 1, page_size: 0,
            }),
            climb_rate: 1,
            digits: 0,
            numeric: true,
            valign: Gtk.Align.CENTER
        });
        settingsHeightScale.set_value(this._settings.get_int("settings-height"));
        settingsHeightScale.connect('value-changed', (widget) => {
            this._settings.set_int("settings-height", widget.get_value());
        });
        let settingsHeightRow = new Adw.ActionRow({
            title: _('Window Height'),
            activatable_widget: settingsHeightScale
        });
        settingsHeightRow.add_suffix(settingsHeightScale);
        settingsSizeFrame.add(settingsHeightRow);

        this.add(settingsSizeFrame);

        let buttonGroup = new Adw.PreferencesGroup({
            title: _("Reset all ArcMenu Settings")
        });
        let resetSettingsButton = new Gtk.Button({
            halign: Gtk.Align.START,
            valign: Gtk.Align.CENTER,
            hexpand: false,
            label: _("Reset all Settings"),
            css_classes: ['destructive-action']
        });
        resetSettingsButton.connect('clicked', (widget) => {
            let dialog = new Gtk.MessageDialog({
                text: "<b>" + _("Reset all settings?") + '</b>',
                secondary_text: _("All ArcMenu settings will be reset to the default value."),
                use_markup: true,
                buttons: Gtk.ButtonsType.YES_NO,
                message_type: Gtk.MessageType.WARNING,
                transient_for: this.get_root(),
                modal: true
            });
            dialog.connect('response', (widget, response) => {
                if(response == Gtk.ResponseType.YES){
                    GLib.spawn_command_line_sync('dconf reset -f /org/gnome/shell/extensions/arcmenu/');
                    Prefs.populateWindow(preferencesWindow, this._settings);
                }
                dialog.destroy();
            });
            dialog.show();
        });
        buttonGroup.add(resetSettingsButton);
        this.add(buttonGroup);
    }
    _showFileChooser(title, params, acceptBtn, acceptHandler) {
        let dialog = new Gtk.FileChooserDialog({
            title: _(title),
            transient_for: this.get_root(),
            modal: true,
            action: params.action,
        });
        dialog.add_button("_Cancel", Gtk.ResponseType.CANCEL);
        dialog.add_button(acceptBtn, Gtk.ResponseType.ACCEPT);

        dialog.connect("response", (self, response) => {
            if(response === Gtk.ResponseType.ACCEPT){
                try {
                    acceptHandler(dialog.get_file().get_path());
                } catch(e) {
                    log('error from ArcMenu filechooser: ' + e);
                }
            }
            dialog.destroy();
        });

        dialog.show();
    }
});