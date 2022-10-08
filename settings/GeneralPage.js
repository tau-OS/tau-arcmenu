const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const {Adw, GdkPixbuf, GObject, Gtk} = imports.gi;
const Constants = Me.imports.constants;
const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

var GeneralPage = GObject.registerClass(
class ArcMenu_GeneralPage extends Adw.PreferencesPage {
    _init(settings) {
        super._init({
            title: _('General'),
            icon_name: 'go-home-symbolic',
            name: 'GeneralPage'
        });
        this._settings = settings;

        let menuDisplayGroup = new Adw.PreferencesGroup({
            title: _("Display Options")
        });
        this.add(menuDisplayGroup);

        //Show Activities Row----------------------------------------------------------------------------
        let showActivitiesSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
            active: this._settings.get_boolean('show-activities-button')
        });
        showActivitiesSwitch.connect('notify::active', (widget) => {
            this._settings.set_boolean('show-activities-button', widget.get_active());
        });
        let showActivitiesRow = new Adw.ActionRow({
            title: _("Show Activities Button"),
            activatable_widget: showActivitiesSwitch
        });
        showActivitiesRow.add_suffix(showActivitiesSwitch);
        //-----------------------------------------------------------------------------------------------

        //Position in Panel Row-------------------------------------------------------------
        let menuPositions = new Gtk.StringList();
        menuPositions.append(_('Left'));
        menuPositions.append(_('Center'));
        menuPositions.append(_('Right'));
        let menuPositionRow = new Adw.ComboRow({
            title: _("Position in Panel"),
            model: menuPositions,
            selected: this._settings.get_enum('position-in-panel')
        });
        menuPositionRow.connect("notify::selected", (widget) => {
            if(widget.selected === Constants.MenuPosition.CENTER)
                menuAlignmentRow.show();
            else
                menuAlignmentRow.hide();
            this._settings.set_enum('position-in-panel', widget.selected);
        });
        //--------------------------------------------------------------------------------------

        //Menu Alignment row--------------------------------------------------------------------
        let menuAlignmentScale = new Gtk.Scale({
            valign: Gtk.Align.CENTER,
            orientation: Gtk.Orientation.HORIZONTAL,
            adjustment: new Gtk.Adjustment({ lower: 0, upper: 100, step_increment: 1, page_increment: 1, page_size: 0 }),
            digits: 0, round_digits: 0, hexpand: true,

        });
        menuAlignmentScale.set_value(this._settings.get_int('menu-position-alignment'));
        menuAlignmentScale.add_mark(0, Gtk.PositionType.BOTTOM, _("Left"));
        menuAlignmentScale.add_mark(50, Gtk.PositionType.BOTTOM, _("Center"));
        menuAlignmentScale.add_mark(100, Gtk.PositionType.BOTTOM, _("Right"));

        menuAlignmentScale.connect('value-changed', (widget) => {
            this._settings.set_int('menu-position-alignment', widget.get_value());
        });
        let menuAlignmentRow = new Adw.ActionRow({
            title: _("Menu Alignment"),
            activatable_widget: menuAlignmentScale,
            visible: this._settings.get_enum('position-in-panel') === Constants.MenuPosition.CENTER
        });
        menuAlignmentRow.add_suffix(menuAlignmentScale);
        //-------------------------------------------------------------------------------------

        //Mulit Monitor Row -------------------------------------------------------------------
        let multiMonitorSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
            active: this._settings.get_boolean('multi-monitor')
        });
        multiMonitorSwitch.connect('notify::active', (widget) => {
            this._settings.set_boolean('multi-monitor', widget.get_active());
            menuHotkeyGroup.displayRows();
            runnerHotkeyGroup.displayRows();
        });

        let multiMonitorRow = new Adw.ActionRow({
            title: _("Display ArcMenu on all Panels"),
            subtitle: _("Dash to Panel or App Icons Taskbar extension required"),
            activatable_widget: multiMonitorSwitch
        });
        multiMonitorRow.add_suffix(multiMonitorSwitch);
        //--------------------------------------------------------------------------------------

        //Prefer Top Panel -------------------------------------------------------------------
        let preferTopPanelSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
            active: this._settings.get_boolean('dash-to-panel-standalone')
        });
        preferTopPanelSwitch.connect('notify::active', (widget) => {
            this._settings.set_boolean('dash-to-panel-standalone', widget.get_active());
        });

        let preferTopPanelRow = new Adw.ActionRow({
            title: _("Always Prefer Top Panel"),
            subtitle: _("Useful with Dash to Panel setting 'Keep original gnome-shell top panel'"),
            activatable_widget: multiMonitorSwitch
        });
        preferTopPanelRow.add_suffix(preferTopPanelSwitch);
        //--------------------------------------------------------------------------------------

        //Add the rows to the group
        menuDisplayGroup.add(menuPositionRow);
        menuDisplayGroup.add(menuAlignmentRow);
        menuDisplayGroup.add(multiMonitorRow);
        menuDisplayGroup.add(preferTopPanelRow);
        menuDisplayGroup.add(showActivitiesRow);

        let menuHotkeyGroup = this._createHotkeyGroup(_("Hotkey Options"), true);
        this.add(menuHotkeyGroup);

        let runnerHotkeyGroup = this._createHotkeyGroup(_("Standalone Runner Menu"), false);
        this.add(runnerHotkeyGroup);
    }

    _createHotkeyGroup(title, isMenuHotkey){
        let hotkeyGroup = new Adw.PreferencesGroup({
            title: _(title)
        });
        let enableRunnerMenuSwitch, hotkeyEnumSetting, customHotkeySetting, primaryMonitorSetting;
        if(isMenuHotkey){
            hotkeyEnumSetting = 'menu-hotkey';
            customHotkeySetting = 'toggle-arcmenu';
            primaryMonitorSetting = 'hotkey-open-primary-monitor';
        }
        else{
            hotkeyEnumSetting = 'runner-menu-hotkey';
            customHotkeySetting = 'toggle-runner-menu';
            primaryMonitorSetting = 'runner-hotkey-open-primary-monitor';

            enableRunnerMenuSwitch = new Gtk.Switch({
                halign: Gtk.Align.END,
                valign: Gtk.Align.CENTER,
                active: this._settings.get_boolean('enable-standlone-runner-menu')
            });
            enableRunnerMenuSwitch.connect('notify::active', (widget) => {
                this._settings.set_boolean('enable-standlone-runner-menu', widget.get_active());
                if(!widget.get_active()){
                    customHotkeyRow.hide();
                    hotkeyRow.hide();
                    primaryMonitorRow.hide();
                }
                else{
                    hotkeyRow.show();
                    if(this._settings.get_boolean('multi-monitor'))
                        primaryMonitorRow.show();

                    if(this._settings.get_enum(hotkeyEnumSetting) === 0)
                        customHotkeyRow.hide();
                    else
                        customHotkeyRow.show();
                }
            });
            let enableRunnerMenuRow = new Adw.ActionRow({
                title: _("Enable a standalone Runner menu"),
                activatable_widget: enableRunnerMenuSwitch
            });
            enableRunnerMenuRow.add_suffix(enableRunnerMenuSwitch);
            hotkeyGroup.add(enableRunnerMenuRow);
        }

        let primaryMonitorSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
            active: this._settings.get_boolean(primaryMonitorSetting)
        });
        primaryMonitorSwitch.connect('notify::active', (widget) => {
            this._settings.set_boolean(primaryMonitorSetting, widget.get_active());
        });
        let primaryMonitorRow = new Adw.ActionRow({
            title: _("Open on Primary Monitor"),
            activatable_widget: primaryMonitorSwitch
        });
        primaryMonitorRow.add_suffix(primaryMonitorSwitch);

        let hotKeyOptions = new Gtk.StringList();
        if(isMenuHotkey)
            hotKeyOptions.append(_("None"));
        hotKeyOptions.append(_("Left Super Key"));
        hotKeyOptions.append(_("Custom Hotkey"));

        let hotkeyRow = new Adw.ComboRow({
            title: isMenuHotkey ? _("Menu Hotkey") : _("Runner Hotkey"),
            model: hotKeyOptions,
            selected: this._settings.get_enum(hotkeyEnumSetting)
        });

        let shortcutCell = new Gtk.ShortcutsShortcut({
            halign: Gtk.Align.START,
            valign: Gtk.Align.CENTER,
            hexpand: true,
        });
        shortcutCell.accelerator = this._settings.get_strv(customHotkeySetting).toString();

        let modifyHotkeyButton = new Gtk.Button({
            label: _("Modify Hotkey"),
            valign: Gtk.Align.CENTER,
        });

        let customHotkeyRow = new Adw.ActionRow({
            title: _("Current Hotkey"),
            activatable_widget: modifyHotkeyButton
        });
        customHotkeyRow.add_suffix(shortcutCell);
        customHotkeyRow.add_suffix(modifyHotkeyButton);
        modifyHotkeyButton.connect('clicked', () => {
            let dialog = new HotkeyDialog(this._settings, this);
            dialog.show();
            dialog.connect('response', (_w, response) => {
                let customHotKeyEnum = isMenuHotkey ? 2 : 1;
                if(response === Gtk.ResponseType.APPLY) {
                    this._settings.set_enum(hotkeyEnumSetting, 0);
                    this._settings.set_strv(customHotkeySetting, [dialog.resultsText]);
                    this._settings.set_enum(hotkeyEnumSetting, customHotKeyEnum);
                    shortcutCell.accelerator = dialog.resultsText;
                    dialog.destroy();
                }
                else {
                    shortcutCell.accelerator = this._settings.get_strv(customHotkeySetting).toString();
                    this._settings.set_enum(hotkeyEnumSetting, customHotKeyEnum);
                    dialog.destroy();
                }
            });
        });

        hotkeyGroup.add(hotkeyRow);
        hotkeyGroup.add(customHotkeyRow);
        hotkeyGroup.add(primaryMonitorRow);

        hotkeyGroup.displayRows = () => {
            if(!isMenuHotkey && !enableRunnerMenuSwitch.get_active())
                return;

            customHotkeyRow.hide();
            primaryMonitorRow.hide();

            let selected = hotkeyRow.selected;
            if(!isMenuHotkey){
                hotkeyRow.hide();
                selected++;
            }
            if(selected === Constants.HotKey.SUPER_L){
                customHotkeyRow.hide();
                if(this._settings.get_boolean('multi-monitor'))
                    primaryMonitorRow.show();
                if(!isMenuHotkey)
                    hotkeyRow.show();
            }
            else if(selected === Constants.HotKey.CUSTOM){
                customHotkeyRow.show();
                if(this._settings.get_boolean('multi-monitor'))
                    primaryMonitorRow.show();
                if(!isMenuHotkey)
                    hotkeyRow.show();
            }
        }

        hotkeyRow.connect('notify::selected', (widget) => {
            hotkeyGroup.displayRows();
            this._settings.set_enum(hotkeyEnumSetting, widget.selected);
        });
        hotkeyGroup.displayRows();

        if(!isMenuHotkey && !enableRunnerMenuSwitch.get_active()){
            customHotkeyRow.hide();
            primaryMonitorRow.hide();
            hotkeyRow.hide();
        }
        return hotkeyGroup;
    }
});

var HotkeyDialog = GObject.registerClass({
    Signals: {
        'response': { param_types: [GObject.TYPE_INT] },
    },
},
class ArcMenu_HotkeyDialog extends Gtk.Window {
    _init(settings, parent) {
        this._settings = settings;
        this.keyEventController = new Gtk.EventControllerKey();

        super._init({
            modal: true,
            title: _("Set Custom Hotkey"),
            transient_for: parent.get_root()
        });
        let vbox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 20,
            homogeneous: false,
            margin_top: 5,
            margin_bottom: 5,
            margin_start: 5,
            margin_end: 5,
            hexpand: true,
            halign: Gtk.Align.FILL
        });
        this.set_child(vbox);
        this._createLayout(vbox);
        this.add_controller(this.keyEventController);
        this.set_size_request(500, 250);
    }

    _createLayout(vbox) {
        let hotkeyKey = '';

        let modFrame = new Adw.PreferencesGroup()
        let modRow = new Adw.ActionRow({
            title: _("Choose Modifiers")
        });

        let buttonBox = new Gtk.Box({
            hexpand: true,
            halign: Gtk.Align.END,
            spacing: 5
        });
        modRow.add_suffix(buttonBox);
        let ctrlButton = new Gtk.ToggleButton({
            label: _("Ctrl"),
            valign: Gtk.Align.CENTER
        });
        let superButton = new Gtk.ToggleButton({
            label: _("Super"),
            valign: Gtk.Align.CENTER
        });
        let shiftButton = new Gtk.ToggleButton({
            label: _("Shift"),
            valign: Gtk.Align.CENTER
        });
        let altButton = new Gtk.ToggleButton({
            label: _("Alt"),
            valign: Gtk.Align.CENTER
        });
        ctrlButton.connect('toggled', () => {
            this.resultsText="";
            if(ctrlButton.get_active()) this.resultsText += "<Ctrl>";
            if(superButton.get_active()) this.resultsText += "<Super>";
            if(shiftButton.get_active()) this.resultsText += "<Shift>";
            if(altButton.get_active()) this.resultsText += "<Alt>";
            this.resultsText += hotkeyKey;
            resultsWidget.accelerator =  this.resultsText;
            applyButton.set_sensitive(true);
        });
        superButton.connect('toggled', () => {
            this.resultsText="";
            if(ctrlButton.get_active()) this.resultsText += "<Ctrl>";
            if(superButton.get_active()) this.resultsText += "<Super>";
            if(shiftButton.get_active()) this.resultsText += "<Shift>";
            if(altButton.get_active()) this.resultsText += "<Alt>";
            this.resultsText += hotkeyKey;
            resultsWidget.accelerator =  this.resultsText;
            applyButton.set_sensitive(true);
        });
        shiftButton.connect('toggled', () => {
            this.resultsText="";
            if(ctrlButton.get_active()) this.resultsText += "<Ctrl>";
            if(superButton.get_active()) this.resultsText += "<Super>";
            if(shiftButton.get_active()) this.resultsText += "<Shift>";
            if(altButton.get_active()) this.resultsText += "<Alt>";
            this.resultsText += hotkeyKey;
            resultsWidget.accelerator =  this.resultsText;
            applyButton.set_sensitive(true);
        });
        altButton.connect('toggled', () => {
            this.resultsText="";
            if(ctrlButton.get_active()) this.resultsText += "<Ctrl>";
            if(superButton.get_active()) this.resultsText += "<Super>";
            if(shiftButton.get_active()) this.resultsText += "<Shift>";
            if(altButton.get_active()) this.resultsText += "<Alt>";
            this.resultsText += hotkeyKey;
            resultsWidget.accelerator =  this.resultsText;
            applyButton.set_sensitive(true);
        });
        buttonBox.append(ctrlButton);
        buttonBox.append(superButton);
        buttonBox.append(shiftButton);
        buttonBox.append(altButton);
        modFrame.add(modRow);
        vbox.append(modFrame);

        let keyFrame = new Adw.PreferencesGroup();
        let keyLabel = new Gtk.Label({
            label: _("Press any key"),
            use_markup: true,
            xalign: .5,
            hexpand: true,
            halign: Gtk.Align.CENTER
        });
        vbox.append(keyLabel);

        let pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_size(Me.path + '/media/icons/prefs_icons/keyboard-symbolic.svg', 256, 72);
        let keyboardImage = Gtk.Picture.new_for_pixbuf(pixbuf);
        keyboardImage.hexpand = true;
        keyboardImage.vexpand = true;
        keyboardImage.halign = Gtk.Align.CENTER;
        keyboardImage.valign = Gtk.Align.CENTER;
        vbox.append(keyboardImage);

        let resultsRow = new Adw.ActionRow({
            title: _("New Hotkey")
        });
        let resultsWidget = new Gtk.ShortcutsShortcut({
            hexpand: true,
            halign: Gtk.Align.END
        });
        resultsRow.add_suffix(resultsWidget);
        keyFrame.add(resultsRow);

        let applyButton = new Gtk.Button({
            label: _("Apply"),
            halign: Gtk.Align.END,
            css_classes: ['suggested-action']
        });
        applyButton.connect('clicked', () => {
            this.emit("response", Gtk.ResponseType.APPLY);
        });
        applyButton.set_sensitive(false);

        this.keyEventController.connect('key-released', (controller, keyval, keycode, state) =>  {
            this.resultsText = "";
            let key = keyval;
            hotkeyKey = Gtk.accelerator_name(key, 0);
            if(ctrlButton.get_active()) this.resultsText += "<Ctrl>";
            if(superButton.get_active()) this.resultsText += "<Super>";
            if(shiftButton.get_active()) this.resultsText += "<Shift>";
            if(altButton.get_active()) this.resultsText += "<Alt>";
            this.resultsText += Gtk.accelerator_name(key,0);
            resultsWidget.accelerator =  this.resultsText;
            applyButton.set_sensitive(true);
        });

        vbox.append(keyFrame);
        vbox.append(applyButton);
    }
});