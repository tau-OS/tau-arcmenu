const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const {Adw, Gio, GLib, GObject, Gtk} = imports.gi;
const Constants = Me.imports.constants;
const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const PW = Me.imports.prefsWidgets;
const _ = Gettext.gettext;

var ListOtherPage = GObject.registerClass(
    class ArcMenu_ListOtherPage extends Gtk.Box {
    _init(settings, listType) {
        super._init({
            margin_top: 10,
            margin_bottom: 10,
            margin_start: 5,
            margin_end: 5,
            spacing: 20,
            orientation: Gtk.Orientation.VERTICAL
        });
        this.frameRows = [];
        this.listType = listType;

        if(this.listType === Constants.MenuSettingsListType.POWER_OPTIONS)
            this.settingString = 'power-options';
        else if(this.listType === Constants.MenuSettingsListType.EXTRA_CATEGORIES)
            this.settingString = 'extra-categories';
        else if(this.listType === Constants.MenuSettingsListType.QUICK_LINKS)
            this.settingString = 'arcmenu-extra-categories-links';

        this._settings = settings;
        this.categoriesFrame = new Adw.PreferencesGroup();

        this._addRowsToFrame(this._settings.get_value(this.settingString).deep_unpack());
        this.append(this.categoriesFrame);
        if(this.listType === Constants.MenuSettingsListType.POWER_OPTIONS){
            let powerDisplayStyleGroup = new Adw.PreferencesGroup({
                title: _("Power Off / Log Out Buttons")
            });
            let powerDisplayStyles = new Gtk.StringList();
            powerDisplayStyles.append(_('Default'));
            powerDisplayStyles.append(_('In-Line'));
            powerDisplayStyles.append(_('Sub Menu'));
            this.powerDisplayStyleRow = new Adw.ComboRow({
                title: _("Display Style"),
                model: powerDisplayStyles,
                selected: this._settings.get_enum('power-display-style')
            });
            this.powerDisplayStyleRow.connect("notify::selected", (widget) => {
                this._settings.set_enum('power-display-style', widget.selected)
            });
            powerDisplayStyleGroup.add(this.powerDisplayStyleRow);
            this.append(powerDisplayStyleGroup);
        }

        this.restoreDefaults = () => {
            this.frameRows.forEach(child => {
                this.categoriesFrame.remove(child);
            });
            this.frameRows = [];

            if(this.powerDisplayStyleRow)
                this.powerDisplayStyleRow.selected = 0;

            this._addRowsToFrame(this._settings.get_default_value(this.settingString).deep_unpack());
            this.saveSettings();
        };
    }

    saveSettings(){
        let array = [];
        this.frameRows.sort((a, b) => {
            return a.get_index() > b.get_index();
        })
        this.frameRows.forEach(child => {
            array.push([child.setting_type, child.switch_active]);
        });

        this._settings.set_value(this.settingString, new GLib.Variant('a(ib)', array));
    }

    _addRowsToFrame(extraCategories){
        for(let i = 0; i < extraCategories.length; i++){
            let categoryEnum = extraCategories[i][0];
            let name, iconString;
            if(this.listType === Constants.MenuSettingsListType.POWER_OPTIONS){
                name = Constants.PowerOptions[categoryEnum].NAME;
                iconString = Constants.PowerOptions[categoryEnum].ICON;
            }
            else {
                name = Constants.Categories[categoryEnum].NAME;
                iconString = Constants.Categories[categoryEnum].ICON
            }

            const row = new PW.DragRow({
                gicon: Gio.icon_new_for_string(iconString),
                switch_enabled: true,
                switch_active: extraCategories[i][1],
            });
            row.activatable_widget = row.switch;
            row.setting_type = extraCategories[i][0];
            row.title = _(name);

            row.connect("drag-drop-done", () => this.saveSettings() );
            row.connect('switch-toggled', () => this.saveSettings() );

            const editEntryButton = new PW.EditEntriesBox({ row: row });
            editEntryButton.connect("row-changed", () => this.saveSettings() );

            row.add_suffix(editEntryButton);
            this.frameRows.push(row);
            this.categoriesFrame.add(row);
        }
    }
});