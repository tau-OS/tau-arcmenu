const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const {Adw, GdkPixbuf, GLib, GObject, Gtk} = imports.gi;
const Constants = Me.imports.constants;
const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const PW = Me.imports.prefsWidgets;
const { SettingsUtils } = Me.imports.settings;
const _ = Gettext.gettext;

const { SaveThemeDialog } = Me.imports.settings.ThemingDialog;
const { ManageThemesDialog } = Me.imports.settings.ThemingDialog;

var ThemingPage = GObject.registerClass(
class ArcMenu_ThemingPage extends Adw.PreferencesPage {
    _init(settings) {
        super._init({
            title: _("Theme"),
            icon_name: 'settings-theme-symbolic',
            name: 'ThemingPage'
        });
        this._settings = settings;

        let overrideThemeGroup = new Adw.PreferencesGroup();
        this.add(overrideThemeGroup);

        let overrideThemeSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER
        });
        overrideThemeSwitch.connect('notify::active', (widget) => {
            if(widget.get_active()){
                menuThemesGroup.show();
                menuGroup.show();
                menuItemsGroup.show();
            }
            else{
                menuThemesGroup.hide();
                menuGroup.hide();
                menuItemsGroup.hide();
            }
            this._settings.set_boolean('override-menu-theme', widget.get_active());
        });
        let overrideThemeRow = new Adw.ActionRow({
            title: _("Override Theme"),
            subtitle: _("Results may vary with third party themes"),
            activatable_widget: overrideThemeSwitch
        });
        overrideThemeRow.add_suffix(overrideThemeSwitch);
        overrideThemeGroup.add(overrideThemeRow);

        let menuThemesGroup = new Adw.PreferencesGroup({
            title: _("Menu Themes")
        });
        this.add(menuThemesGroup);

        //Theme Combo Box Section----------
        let themeList = new Gtk.ListStore();
        themeList.set_column_types([GdkPixbuf.Pixbuf, GObject.TYPE_STRING]);
        this.createIconList(themeList);

        let themeComboBox = new Gtk.ComboBox({
            model: themeList,
            valign: Gtk.Align.CENTER
        });
        let renderer = new Gtk.CellRendererPixbuf({xpad: 5});
        themeComboBox.pack_start(renderer, false);
        themeComboBox.add_attribute(renderer, "pixbuf", 0);
        renderer = new Gtk.CellRendererText();
        themeComboBox.pack_start(renderer, true);
        themeComboBox.add_attribute(renderer, "text", 1);

        themeComboBox.connect('changed', (widget) => {
            const index = widget.get_active();
            if(index < 0)
                return;

            let menuThemes = this._settings.get_value('menu-themes').deep_unpack();

            menuBGColorRow.setColor(menuThemes[index][1]);
            menuFGColorRow.setColor(menuThemes[index][2]);
            menuBorderColorRow.setColor(menuThemes[index][3]);

            menuBorderWidthRow.setValue(menuThemes[index][4]);
            menuBorderRadiusRow.setValue(menuThemes[index][5]);
            menuFontSizeRow.setValue(menuThemes[index][6]);

            menuSeparatorColorRow.setColor(menuThemes[index][7]);
            itemHoverBGColorRow.setColor(menuThemes[index][8]);
            itemHoverFGColorRow.setColor(menuThemes[index][9]);
            itemActiveBGColorRow.setColor(menuThemes[index][10]);
            itemActiveFGColorRow.setColor(menuThemes[index][11]);

            this.checkIfThemeMatch();
        });
        let menuThemesRow = new Adw.ActionRow({
            title: _("Current Theme"),
            activatable_widget: themeComboBox
        });
        menuThemesGroup.add(menuThemesRow);
        //---------------------------------

        //Manage Themes Section------------
        let manageThemesButton = new Gtk.Button({
            icon_name: 'emblem-system-symbolic',
            valign: Gtk.Align.CENTER
        });
        manageThemesButton.connect("clicked" , () => {
            let manageThemesDialog = new ManageThemesDialog(this._settings, this);
            manageThemesDialog.show();
            manageThemesDialog.connect('response', (_w, response) => {
                if(response === Gtk.ResponseType.APPLY){
                    themeList.clear();
                    this.createIconList(themeList);
                    this.checkIfThemeMatch();
                }
            });
        });
        menuThemesRow.add_suffix(manageThemesButton);
        menuThemesRow.add_suffix(themeComboBox);
        //---------------------------------

        //Save Theme Section---------------
        let menuThemeSaveButton = new Gtk.Button({
            label: _("Save as Theme"),
            valign: Gtk.Align.CENTER,
            css_classes: ['suggested-action']
        });
        menuThemeSaveButton.connect("clicked" , () => {
            let saveThemeDialog = new SaveThemeDialog(this._settings, this);
            saveThemeDialog.show();
            saveThemeDialog.connect('response', (_w, response) => {
                if(response === Gtk.ResponseType.APPLY){
                    let menuThemes = this._settings.get_value('menu-themes').deep_unpack();
                    let currentSettingsArray = [saveThemeDialog.themeName, menuBGColorRow.getColor(), menuFGColorRow.getColor(), menuBorderColorRow.getColor(), menuBorderWidthRow.getValue().toString(),
                                                menuBorderRadiusRow.getValue().toString(), menuFontSizeRow.getValue().toString(), menuSeparatorColorRow.getColor(), itemHoverBGColorRow.getColor(),
                                                itemHoverFGColorRow.getColor(), itemActiveBGColorRow.getColor(), itemActiveFGColorRow.getColor()];
                    menuThemes.push(currentSettingsArray);
                    this._settings.set_value('menu-themes', new GLib.Variant('aas', menuThemes));

                    themeList.clear();
                    this.createIconList(themeList);
                    this.checkIfThemeMatch();

                    saveThemeDialog.destroy();
                }
            });
        });
        //---------------------------------

        let menuGroup = new Adw.PreferencesGroup({
            title: _("Menu Styling"),
            header_suffix: menuThemeSaveButton
        });
        this.add(menuGroup);

        let menuBGColorRow = this._createColorRow(_("Background Color"), 'menu-background-color');
        menuGroup.add(menuBGColorRow);

        let menuFGColorRow = this._createColorRow(_("Foreground Color"), 'menu-foreground-color');
        menuGroup.add(menuFGColorRow);

        let menuBorderColorRow = this._createColorRow(_("Border Color"), 'menu-border-color');
        menuGroup.add(menuBorderColorRow);

        let menuBorderWidthRow = this._createSpinButtonRow(_("Border Width"), 'menu-border-width', 0, 5);
        menuGroup.add(menuBorderWidthRow);

        let menuBorderRadiusRow = this._createSpinButtonRow(_("Border Radius"), 'menu-border-radius', 0, 25);
        menuGroup.add(menuBorderRadiusRow);

        let menuFontSizeRow = this._createSpinButtonRow(_("Font Size"), 'menu-font-size', 8, 18);
        menuGroup.add(menuFontSizeRow);

        let menuSeparatorColorRow = this._createColorRow(_("Separator Color"), 'menu-separator-color');
        menuGroup.add(menuSeparatorColorRow);

        let menuItemsGroup = new Adw.PreferencesGroup({
            title: _("Menu Items Styling")
        });
        this.add(menuItemsGroup);

        let itemHoverBGColorRow = this._createColorRow(_("Hover") + " " + _("Background Color"), 'menu-item-hover-bg-color');
        menuItemsGroup.add(itemHoverBGColorRow);

        let itemHoverFGColorRow = this._createColorRow(_("Hover") + " " + _("Foreground Color"), 'menu-item-hover-fg-color');
        menuItemsGroup.add(itemHoverFGColorRow);

        let itemActiveBGColorRow = this._createColorRow(_("Active") + " " + _("Background Color"), 'menu-item-active-bg-color');
        menuItemsGroup.add(itemActiveBGColorRow);

        let itemActiveFGColorRow = this._createColorRow(_("Active") + " " + _("Foreground Color"), 'menu-item-active-fg-color');
        menuItemsGroup.add(itemActiveFGColorRow);

        let overrideMenuTheme = this._settings.get_boolean('override-menu-theme');
        overrideThemeSwitch.set_active(overrideMenuTheme);
        if(!overrideMenuTheme){
            menuThemesGroup.hide();
            menuGroup.hide();
            menuItemsGroup.hide();
        }

        this.checkIfThemeMatch = () => {
            let currentSettingsArray = ['', menuBGColorRow.getColor(), menuFGColorRow.getColor(), menuBorderColorRow.getColor(), menuBorderWidthRow.getValue().toString(),
                                        menuBorderRadiusRow.getValue().toString(), menuFontSizeRow.getValue().toString(), menuSeparatorColorRow.getColor(), itemHoverBGColorRow.getColor(),
                                        itemHoverFGColorRow.getColor(), itemActiveBGColorRow.getColor(), itemActiveFGColorRow.getColor()];

            let menuThemes = this._settings.get_value('menu-themes').deep_unpack();
            let index = 0;
            let matchFound = false;
            for(let theme of menuThemes){
                for(let i = 1; i < currentSettingsArray.length - 1; i++){
                    if(currentSettingsArray[i] !== theme[i]){
                        matchFound = false;
                        break;
                    }
                    matchFound = true;
                }

                if(matchFound){
                    themeComboBox.set_active(index);
                    menuThemeSaveButton.set_sensitive(false);
                    break;
                }
                index ++;
            }
            if(!matchFound){
                menuThemeSaveButton.set_sensitive(true);
                themeComboBox.set_active(-1);
            }
        }

        this.checkIfThemeMatch();
    }

    createIconList(store){
        let menuThemes = this._settings.get_value('menu-themes').deep_unpack();
        for(let theme of menuThemes){
            let xpm = SettingsUtils.createXpmImage(theme[1], theme[2], theme[3], theme[8]);
            let pixbuf = GdkPixbuf.Pixbuf.new_from_xpm_data(xpm);

            store.set(store.append(), [0, 1], [pixbuf, theme[0]]);
        }
    }

    _createColorRow(title, setting){
        let colorButton = new Gtk.ColorButton({
            use_alpha: true,
            valign: Gtk.Align.CENTER,
            rgba: SettingsUtils.parseRGBA(this._settings.get_string(setting))
        });
        colorButton.connect('notify::rgba', (widget) => {
            let colorString = widget.get_rgba().to_string();
            this._settings.set_string(setting, colorString);
            this.checkIfThemeMatch();
        });
        let colorRow = new Adw.ActionRow({
            title: _(title),
            activatable_widget: colorButton,
        });
        colorRow.add_suffix(colorButton);
        colorRow.setColor = (color) => {
            colorButton.set_rgba(SettingsUtils.parseRGBA(color));
        };
        colorRow.getColor = () => {
            return colorButton.get_rgba().to_string();
        }
        return colorRow;
    }

    _createSpinButtonRow(title, setting, lower, upper){
        let spinButton = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower,
                upper,
                step_increment: 1
            }),
            climb_rate: 1,
            digits: 0,
            numeric: true,
            valign: Gtk.Align.CENTER,
            value: this._settings.get_int(setting)
        });
        spinButton.connect('notify::value', (widget) => {
            this.checkIfThemeMatch();
            this._settings.set_int(setting, widget.get_value());
        });

        let spinRow = new Adw.ActionRow({
            title: _(title),
            activatable_widget: spinButton,
        });
        spinRow.add_suffix(spinButton);
        spinRow.setValue = (value) => {
            spinButton.set_value(value);
        };
        spinRow.getValue = () => {
            return spinButton.get_value();
        }
        return spinRow;
    }
});
