const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const {Adw, GObject, Gtk} = imports.gi;
const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const PW = Me.imports.prefsWidgets;
const _ = Gettext.gettext;

var FineTunePage = GObject.registerClass(
class ArcMenu_FineTunePage extends Gtk.Box {
    _init(settings) {
        super._init({
            margin_top: 10,
            margin_bottom: 10,
            margin_start: 5,
            margin_end: 5,
            spacing: 20,
            orientation: Gtk.Orientation.VERTICAL
        });
        this._settings = settings;
        this.disableFadeEffect = this._settings.get_boolean('disable-scrollview-fade-effect');
        this.alphabetizeAllPrograms = this._settings.get_boolean('alphabetize-all-programs')
        this.multiLinedLabels = this._settings.get_boolean('multi-lined-labels');
        this.disableTooltips = this._settings.get_boolean('disable-tooltips');
        this.disableRecentApps = this._settings.get_boolean('disable-recently-installed-apps');
        this.showHiddenRecentFiles = this._settings.get_boolean('show-hidden-recent-files');

        let fadeEffectFrame = new Adw.PreferencesGroup();
        let fadeEffectSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER
        });
        fadeEffectSwitch.set_active(this._settings.get_boolean('disable-scrollview-fade-effect'));
        fadeEffectSwitch.connect('notify::active', (widget) => {
            this._settings.set_boolean('disable-scrollview-fade-effect', widget.get_active());
        });
        let fadeEffectRow = new Adw.ActionRow({
            title: _("Disable ScrollView Fade Effects"),
            activatable_widget: fadeEffectSwitch
        });
        fadeEffectRow.add_suffix(fadeEffectSwitch);
        fadeEffectFrame.add(fadeEffectRow);
        this.append(fadeEffectFrame);

        let tooltipFrame = new Adw.PreferencesGroup();
        let tooltipSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER
        });
        tooltipSwitch.set_active(this.disableTooltips);
        tooltipSwitch.connect('notify::active', (widget) => {
            this._settings.set_boolean('disable-tooltips', widget.get_active());
        });
        let tooltipRow = new Adw.ActionRow({
            title: _("Disable Tooltips"),
            activatable_widget: tooltipSwitch
        });
        tooltipRow.add_suffix(tooltipSwitch);
        tooltipFrame.add(tooltipRow);
        this.append(tooltipFrame);

        let alphabetizeAllProgramsFrame = new Adw.PreferencesGroup();
        let alphabetizeAllProgramsSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER
        });
        alphabetizeAllProgramsSwitch.set_active(this._settings.get_boolean('alphabetize-all-programs'));
        alphabetizeAllProgramsSwitch.connect('notify::active', (widget) => {
            this._settings.set_boolean('alphabetize-all-programs', widget.get_active());
        });
        let alphabetizeAllProgramsRow = new Adw.ActionRow({
            title: _("Alphabetize 'All Programs' Category"),
            activatable_widget: alphabetizeAllProgramsSwitch
        });
        alphabetizeAllProgramsRow.add_suffix(alphabetizeAllProgramsSwitch);
        alphabetizeAllProgramsFrame.add(alphabetizeAllProgramsRow);
        this.append(alphabetizeAllProgramsFrame);

        let hiddenFilesFrame = new Adw.PreferencesGroup();
        let hiddenFilesSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER
        });
        hiddenFilesSwitch.set_active(this._settings.get_boolean('show-hidden-recent-files'));
        hiddenFilesSwitch.connect('notify::active', (widget) => {
            this._settings.set_boolean('show-hidden-recent-files', widget.get_active());
        });
        let hiddenFilesRow = new Adw.ActionRow({
            title: _("Show Hidden Recent Files"),
            activatable_widget: hiddenFilesSwitch
        });
        hiddenFilesRow.add_suffix(hiddenFilesSwitch);
        hiddenFilesFrame.add(hiddenFilesRow);
        this.append(hiddenFilesFrame);

        let multiLinedLabelFrame = new Adw.PreferencesGroup();
        let multiLinedLabelSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER
        });
        multiLinedLabelSwitch.set_active(this._settings.get_boolean('multi-lined-labels'));
        multiLinedLabelSwitch.connect('notify::active', (widget) => {
            this._settings.set_boolean('multi-lined-labels', widget.get_active());
        });
        let multiLinedLabelInfoButton = new PW.Button({
                icon_name: 'help-about-symbolic'
        });
        multiLinedLabelInfoButton.connect('clicked', () => {
            let dialog = new Gtk.MessageDialog({
                text: "<b>" + _("Multi-Lined Labels") + '</b>\n' + _('Enable/Disable multi-lined labels on large application icon layouts.'),
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
        let multiLinedLabelRow = new Adw.ActionRow({
            title: _("Multi-Lined Labels"),
            activatable_widget: multiLinedLabelSwitch
        });
        multiLinedLabelRow.add_suffix(multiLinedLabelSwitch);
        multiLinedLabelRow.add_suffix(multiLinedLabelInfoButton);
        multiLinedLabelFrame.add(multiLinedLabelRow);
        this.append(multiLinedLabelFrame);

        let recentAppsFrame = new Adw.PreferencesGroup();
        let recentAppsSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });
        recentAppsSwitch.connect('notify::active', (widget) => {
            if(widget.get_active()){
                clearRecentAppsRow.hide();
            }
            else{
                clearRecentAppsRow.show();
            }
            this._settings.set_boolean('disable-recently-installed-apps', widget.get_active());
        });
        let recentAppsRow = new Adw.ActionRow({
            title: _("Disable New Apps Tracker"),
            activatable_widget: recentAppsSwitch
        });
        recentAppsRow.add_suffix(recentAppsSwitch);
        recentAppsFrame.add(recentAppsRow);
        this.append(recentAppsFrame);

        let clearRecentAppsButton = new Gtk.Button({
            halign: Gtk.Align.END,
            valign: Gtk.Align.CENTER,
            label: _("Clear All"),
        });
        let sensitive = this._settings.get_strv('recently-installed-apps').length > 0;
        clearRecentAppsButton.set_sensitive(sensitive);
        clearRecentAppsButton.connect('clicked', (widget) => {
            clearRecentAppsButton.set_sensitive(false);
            this._settings.reset('recently-installed-apps');
        });
        let clearRecentAppsRow = new Adw.ActionRow({
            title: _("Clear Apps Marked 'New'"),
            activatable_widget: clearRecentAppsButton
        });
        clearRecentAppsRow.add_suffix(clearRecentAppsButton);
        recentAppsFrame.add(clearRecentAppsRow);

        recentAppsSwitch.set_active(this._settings.get_boolean('disable-recently-installed-apps'));

        this.restoreDefaults = () => {
            this.alphabetizeAllPrograms = this._settings.get_default_value('alphabetize-all-programs').unpack();
            this.multiLinedLabels = this._settings.get_default_value('multi-lined-labels').unpack();
            this.disableTooltips = this._settings.get_default_value('disable-tooltips').unpack();
            this.disableFadeEffect = this._settings.get_default_value('disable-scrollview-fade-effect').unpack();
            this.disableRecentApps = this._settings.get_default_value('disable-recently-installed-apps').unpack();
            this.showHiddenRecentFiles = this._settings.get_default_value('show-hidden-recent-files').unpack();
            alphabetizeAllProgramsSwitch.set_active(this.alphabetizeAllPrograms);
            multiLinedLabelSwitch.set_active(this.multiLinedLabels);
            tooltipSwitch.set_active(this.disableTooltips);
            fadeEffectSwitch.set_active(this.disableFadeEffect);
            recentAppsSwitch.set_active(this.disableRecentApps);
            hiddenFilesSwitch.set_active(this.showHiddenRecentFiles);
        };
    }
});
