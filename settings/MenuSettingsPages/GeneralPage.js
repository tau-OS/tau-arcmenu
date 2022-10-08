const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const {Adw, Gdk, GLib, GObject, Gtk} = imports.gi;
const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

var GeneralPage = GObject.registerClass(
    class ArcMenu_MenuSettingsGeneralPage extends Gtk.Box {
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

        let menuSizeFrame = new Adw.PreferencesGroup({
            title: _("Menu Size")
        });
        this.append(menuSizeFrame);

        let heightSpinButton = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 300, upper: 4320, step_increment: 25, page_increment: 50, page_size: 0,
            }),
            climb_rate: 25,
            digits: 0,
            numeric: true,
            valign: Gtk.Align.CENTER,
        });
        heightSpinButton.set_value(this._settings.get_int('menu-height'));
        heightSpinButton.connect('value-changed', (widget) => {
            this._settings.set_int('menu-height', widget.get_value());
        });
        let heightRow = new Adw.ActionRow({
            title: _('Height'),
            activatable_widget: heightSpinButton
        });
        heightRow.add_suffix(heightSpinButton);
        menuSizeFrame.add(heightRow);

        let menuWidthSpinButton = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 175, upper: 500, step_increment: 25, page_increment: 50, page_size: 0,
            }),
            climb_rate: 25,
            digits: 0,
            numeric: true,
            valign: Gtk.Align.CENTER,
        });
        menuWidthSpinButton.set_value(this._settings.get_int('left-panel-width'));
        menuWidthSpinButton.connect('value-changed', (widget) => {
            this._settings.set_int('left-panel-width', widget.get_value());
        });
        let menuWidthRow = new Adw.ActionRow({
            title: _('Left-Panel Width'),
            subtitle: _("Traditional Layouts"),
            activatable_widget: menuWidthSpinButton
        });
        menuWidthRow.add_suffix(menuWidthSpinButton);
        menuSizeFrame.add(menuWidthRow);

        let rightPanelWidthSpinButton = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 200,upper: 500, step_increment: 25, page_increment: 50, page_size: 0,
            }),
            climb_rate: 25,
            valign: Gtk.Align.CENTER,
            digits: 0,
            numeric: true,
        });
        rightPanelWidthSpinButton.set_value(this._settings.get_int('right-panel-width'));
        rightPanelWidthSpinButton.connect('value-changed', (widget) => {
            this._settings.set_int('right-panel-width', widget.get_value());
        });
        let rightPanelWidthRow = new Adw.ActionRow({
            title: _('Right-Panel Width'),
            subtitle: _("Traditional Layouts"),
            activatable_widget: rightPanelWidthSpinButton
        });
        rightPanelWidthRow.add_suffix(rightPanelWidthSpinButton);
        menuSizeFrame.add(rightPanelWidthRow);

        let widthSpinButton = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: -350, upper: 600, step_increment: 25, page_increment: 50, page_size: 0,
            }),
            valign: Gtk.Align.CENTER,
            climb_rate: 25,
            digits: 0,
            numeric: true,
        });
        widthSpinButton.set_value(this._settings.get_int('menu-width-adjustment'));
        widthSpinButton.connect('value-changed', (widget) => {
            this._settings.set_int('menu-width-adjustment', widget.get_value());
        });
        let widthRow = new Adw.ActionRow({
            title: _('Width Offset'),
            subtitle: _("Non-Traditional Layouts"),
            activatable_widget: widthSpinButton
        });
        widthRow.add_suffix(widthSpinButton);
        menuSizeFrame.add(widthRow);

        let generalSettingsFrame = new Adw.PreferencesGroup({
            title: _('General Settings')
        });
        this.append(generalSettingsFrame);

        let menuLocations = new Gtk.StringList();
        menuLocations.append(_('Off'));
        menuLocations.append(_('Top Centered'));
        menuLocations.append(_('Bottom Centered'));
        let menuLocationRow = new Adw.ComboRow({
            title: _("Override Menu Location"),
            model: menuLocations,
            selected: this._settings.get_enum('force-menu-location')
        });
        menuLocationRow.connect("notify::selected", (widget) => {
            this._settings.set_enum('force-menu-location', widget.selected)
        });
        generalSettingsFrame.add(menuLocationRow);

        let [menuArrowRiseEnabled, menuArrowRiseValue] = this._settings.get_value('menu-arrow-rise').deep_unpack();

        let menuArrowRiseSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });
        menuArrowRiseSwitch.connect('notify::active', (widget) => {
            let [oldEnabled_, oldValue] = this._settings.get_value('menu-arrow-rise').deep_unpack();
            this._settings.set_value('menu-arrow-rise', new GLib.Variant('(bi)', [widget.get_active(), oldValue]));
            if(widget.get_active())
                menuArrowRiseSpinButton.set_sensitive(true);
            else
                menuArrowRiseSpinButton.set_sensitive(false);
        });
        let menuArrowRiseSpinButton = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 25,
                step_increment: 1
            }),
            climb_rate: 1,
            digits: 0,
            numeric: true,
            valign: Gtk.Align.CENTER,
            value: menuArrowRiseValue,
            sensitive: menuArrowRiseEnabled
        });
        menuArrowRiseSpinButton.connect('value-changed', (widget) => {
            let [oldEnabled, oldValue_] = this._settings.get_value('menu-arrow-rise').deep_unpack();
            this._settings.set_value('menu-arrow-rise', new GLib.Variant('(bi)', [oldEnabled, widget.get_value()]));
        });

        let menuArrowRiseRow = new Adw.ActionRow({
            title: _("Override Menu Rise"),
            subtitle: _("Menu Distance from Panel and Screen Edge"),
            activatable_widget: menuArrowRiseSwitch
        });
        menuArrowRiseRow.add_suffix(menuArrowRiseSwitch);
        menuArrowRiseRow.add_suffix(new Gtk.Separator({
            orientation: Gtk.Orientation.VERTICAL,
            margin_top: 10,
            margin_bottom: 10
        }));
        menuArrowRiseRow.add_suffix(menuArrowRiseSpinButton);
        menuArrowRiseSwitch.set_active(menuArrowRiseEnabled);
        generalSettingsFrame.add(menuArrowRiseRow);

        let appDescriptionsSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });
        appDescriptionsSwitch.set_active(this._settings.get_boolean('apps-show-extra-details'));
        appDescriptionsSwitch.connect('notify::active', (widget) => {
            this._settings.set_boolean('apps-show-extra-details', widget.get_active())
        });
        let appDescriptionsRow = new Adw.ActionRow({
            title: _("Show Application Descriptions"),
            activatable_widget: appDescriptionsSwitch
        });
        appDescriptionsRow.add_suffix(appDescriptionsSwitch);
        generalSettingsFrame.add(appDescriptionsRow);

        let iconTypes = new Gtk.StringList();
        iconTypes.append(_('Full Color'));
        iconTypes.append(_('Symbolic'));
        let categoryIconTypeRow = new Adw.ComboRow({
            title: _('Category Icon Type'),
            subtitle: _("Some icon themes may not include selected icon type"),
            model: iconTypes,
            selected: this._settings.get_enum('category-icon-type')
        });
        categoryIconTypeRow.connect('notify::selected', (widget) => {
            this._settings.set_enum('category-icon-type', widget.selected);
        });
        generalSettingsFrame.add(categoryIconTypeRow);

        let shortcutsIconTypeRow = new Adw.ComboRow({
            title: _('Shortcuts Icon Type'),
            subtitle: _("Some icon themes may not include selected icon type"),
            model: iconTypes,
            selected: this._settings.get_enum('shortcut-icon-type')
        });
        shortcutsIconTypeRow.connect('notify::selected', (widget) => {
            this._settings.set_enum('shortcut-icon-type', widget.selected);
        });
        generalSettingsFrame.add(shortcutsIconTypeRow);

        let vertSeparatorSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
            active: this._settings.get_boolean('vert-separator')
        });
        vertSeparatorSwitch.connect('notify::active', (widget) => {
            this._settings.set_boolean('vert-separator', widget.get_active());
        });
        let vertSeparatorRow = new Adw.ActionRow({
            title: _('Vertical Separator'),
            subtitle: _("Traditional Layouts"),
            activatable_widget:  vertSeparatorSwitch
        });
        vertSeparatorRow.add_suffix(vertSeparatorSwitch);
        generalSettingsFrame.add(vertSeparatorRow);

        let iconsSizeFrame = new Adw.PreferencesGroup({
            title: _("Icon Sizes"),
            description: _("Modify the icon size of various menu elements.")
        });
        this.append(iconsSizeFrame);

        let iconSizes = new Gtk.StringList();
        iconSizes.append(_('Default'));
        iconSizes.append(_('Small') + " - " + _('Square'));
        iconSizes.append(_('Medium') + " - " + _('Square'));
        iconSizes.append(_('Large') + " - " + _('Square'));
        iconSizes.append(_('Small') + " - " + _('Wide'));
        iconSizes.append(_('Medium') + " - " + _('Wide'));
        iconSizes.append(_('Large') + " - " + _('Wide'));
        let gridIconsSizeRow = new Adw.ComboRow({
            title: _("Grid Icons"),
            model: iconSizes,
            selected: this._settings.get_enum('menu-item-grid-icon-size')
        });
        gridIconsSizeRow.connect('notify::selected', (widget) => {
            this._settings.set_enum('menu-item-grid-icon-size', widget.selected);
        });
        iconsSizeFrame.add(gridIconsSizeRow);

        let menuItemIconSizeRow = this.createIconSizeRow(_("Applications"), 'menu-item-icon-size');
        iconsSizeFrame.add(menuItemIconSizeRow);
        let menuCategoryIconSizeRow = this.createIconSizeRow(_("Categories"), 'menu-item-category-icon-size');
        iconsSizeFrame.add(menuCategoryIconSizeRow);
        let buttonIconSizeRow = this.createIconSizeRow(_("Buttons"), 'button-item-icon-size');
        iconsSizeFrame.add(buttonIconSizeRow);
        let quicklinksIconSizeRow = this.createIconSizeRow(_("Quick Links"),'quicklinks-item-icon-size');
        iconsSizeFrame.add(quicklinksIconSizeRow);
        let miscIconSizeRow = this.createIconSizeRow(_("Misc"), 'misc-item-icon-size');
        iconsSizeFrame.add(miscIconSizeRow);

        this.restoreDefaults = () => {
            heightSpinButton.set_value(this._settings.get_default_value('menu-height').unpack());
            widthSpinButton.set_value(this._settings.get_default_value('menu-width-adjustment').unpack());
            menuWidthSpinButton.set_value(this._settings.get_default_value('left-panel-width').unpack());
            rightPanelWidthSpinButton.set_value(this._settings.get_default_value('right-panel-width').unpack());
            vertSeparatorSwitch.set_active(this._settings.get_default_value('vert-separator').unpack());
            gridIconsSizeRow.selected = 0;
            menuItemIconSizeRow.selected = 0;
            menuCategoryIconSizeRow.selected = 0;
            buttonIconSizeRow.selected = 0;
            quicklinksIconSizeRow.selected = 0;
            miscIconSizeRow.selected = 0;
            appDescriptionsSwitch.set_active(this._settings.get_default_value('apps-show-extra-details').unpack());
            menuLocationRow.selected = 0;
            let [menuRiseEnabled_, menuRiseDefault] = this._settings.get_default_value('menu-arrow-rise').deep_unpack();
            menuArrowRiseSpinButton.set_value(menuRiseDefault);
            menuArrowRiseSwitch.set_active(false);
            categoryIconTypeRow.selected = 0;
            shortcutsIconTypeRow.selected = 1;
        };
    }

    createIconSizeRow(title, setting){
        let iconSizes = new Gtk.StringList();
        iconSizes.append(_('Default'));
        iconSizes.append(_('Extra Small'));
        iconSizes.append(_('Small'));
        iconSizes.append(_('Medium'));
        iconSizes.append(_('Large'));
        iconSizes.append(_('Extra Large'));

        if(setting === 'menu-item-category-icon-size')
            iconSizes.append(_('Hidden'));

        let iconsSizeRow = new Adw.ComboRow({
            title: _(title),
            model: iconSizes,
            selected: this._settings.get_enum(setting)
        });
        iconsSizeRow.connect('notify::selected', (widget) => {
            this._settings.set_enum(setting, widget.selected);
        });
        return iconsSizeRow;
    }
});