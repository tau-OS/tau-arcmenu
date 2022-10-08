const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const {Adw, Gio, GObject, Gtk} = imports.gi;
const Constants = Me.imports.constants;
const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const { LayoutTweaksPage } = Me.imports.settings.LayoutTweaksPage;
const PW = Me.imports.prefsWidgets;
const _ = Gettext.gettext;

var LayoutsPage = GObject.registerClass(
class ArcMenu_LayoutsPage extends Adw.PreferencesPage {
    _init(settings) {
        super._init({
            title: _('Layouts'),
            icon_name: 'settings-layouts-symbolic',
            name: 'LayoutsPage'
        });
        this._settings = settings;

        let mainGroup = new Adw.PreferencesGroup();
        this.add(mainGroup);

        let mainBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            margin_start: 5,
            margin_end: 5,
            spacing: 20,
            vexpand: true,
            valign: Gtk.Align.FILL
        });

        this.mainLeaflet = new Adw.Leaflet({
            homogeneous: false,
            transition_type: Adw.LeafletTransitionType.SLIDE,
            can_navigate_back: true,
            can_navigate_forward: false,
            can_unfold: false,
        });

        this.subLeaflet = new Adw.Leaflet({
            homogeneous: false,
            transition_type: Adw.LeafletTransitionType.SLIDE,
            can_navigate_back: false,
            can_navigate_forward: false,
            can_unfold: false,
        });

        let leafletPage = this.mainLeaflet.append(mainBox);
        leafletPage.name = "MainView";

        leafletPage = this.mainLeaflet.append(this.subLeaflet);
        leafletPage.name = "SubView";

        mainGroup.add(this.mainLeaflet);

        let currentLayoutGroup = new Adw.PreferencesGroup({
            title: _("Current Menu Layout"),
        });
        let currentLayoutName = this.getMenuLayoutName(this._settings.get_enum('menu-layout'));
        let currentLayoutImagePath = this.getMenuLayoutImagePath(this._settings.get_enum('menu-layout'));
        let imagePixelSize = 155;
        let currentLayoutBoxRow = new PW.MenuLayoutRow(currentLayoutName, currentLayoutImagePath, imagePixelSize);

        currentLayoutBoxRow.connect('activated', () => {
            this.displayLayoutTweaksPage();
        });

        currentLayoutGroup.add(currentLayoutBoxRow);
        mainBox.append(currentLayoutGroup);

        let availableLayoutGroup = new Adw.PreferencesGroup({
            title: _("Available Menu Layouts"),
        });
        mainBox.append(availableLayoutGroup);

        Constants.MenuStyles.STYLES.forEach((style) => {
            let tile = new PW.MenuLayoutRow(_("%s Menu Layouts").format(_(style.TITLE)) , style.IMAGE, 46, style);
            availableLayoutGroup.add(tile);

            let menuLayoutsBox = new LayoutsCategoryPage(this._settings, this, tile, style.TITLE);
            menuLayoutsBox.connect('menu-layout-response', (dialog, response) => {
                if(response === Gtk.ResponseType.APPLY) {
                    this._settings.set_enum('menu-layout', dialog.menuLayout);
                    currentLayoutBoxRow.label.label = "<b>" + this.getMenuLayoutName(dialog.menuLayout) + "</b>";
                    tweaksLabel.label = this.getMenuLayoutTweaksName(dialog.menuLayout);
                    currentLayoutBoxRow.image.gicon = Gio.icon_new_for_string(this.getMenuLayoutImagePath(dialog.menuLayout));
                    this.mainLeaflet.set_visible_child_name("MainView");
                }
                if(response === Gtk.ResponseType.CANCEL){
                    this.mainLeaflet.set_visible_child_name("MainView");
                    menuLayoutsBox.clearSelection();
                }
            });
            leafletPage = this.subLeaflet.append(menuLayoutsBox);
            leafletPage.name = `Layout_${style.TITLE}`;
            tile.connect('activated', () => {
                this.subLeaflet.set_visible_child_name(`Layout_${style.TITLE}`);
                this.mainLeaflet.set_visible_child_name("SubView");
            });
        });

        this.layoutsTweaksPage = new LayoutTweaksPage(this._settings, this.getMenuLayoutTweaksName(this._settings.get_enum('menu-layout')));
        this.layoutsTweaksPage.connect("response", (page, response) => {
            if(response === -20)
                this.mainLeaflet.set_visible_child_name("MainView");
        });
        let tweaksLabel = new Gtk.Label({
            label: this.getMenuLayoutTweaksName(this._settings.get_enum('menu-layout')),
            use_markup: true,
            halign: Gtk.Align.END,
            vexpand: true,
            hexpand: true
        });

        leafletPage = this.subLeaflet.append(this.layoutsTweaksPage);
        leafletPage.name = "LayoutsTweaks";
        this.mainLeaflet.set_visible_child_name("MainView");

        this.mainLeaflet.connect('notify::visible-child', () => {
            const visibleChild = this.subLeaflet.get_visible_child();
            if(visibleChild instanceof LayoutsCategoryPage)
                visibleChild.clearSelection();
        });
    }

    displayLayoutTweaksPage(){
        let layoutName = this.getMenuLayoutTweaksName(this._settings.get_enum('menu-layout'));
        this.layoutsTweaksPage.setActiveLayout(this._settings.get_enum('menu-layout'), layoutName);
        this.subLeaflet.set_visible_child_name("LayoutsTweaks");
        this.mainLeaflet.set_visible_child_name("SubView");
    }

    displayLayouts(){
        this.mainLeaflet.set_visible_child_name("MainView");
    }

    displayRunnerTweaksPage(){
        if(!this.runnerTweaksPage){
            let activeLayoutName = this.getMenuLayoutTweaksName(Constants.MenuLayout.RUNNER);
            this.runnerTweaksPage = new LayoutTweaksPage(this._settings, activeLayoutName);
            let leafletPage = this.subLeaflet.append(this.runnerTweaksPage);
            leafletPage.name = "RunnerTweaks";
            this.runnerTweaksPage.connect("response", (page, response) => {
                if(response === -20)
                    this.mainLeaflet.set_visible_child_name("MainView");
            });
            this.runnerTweaksPage.setActiveLayout(Constants.MenuLayout.RUNNER);
        }
        this.subLeaflet.set_visible_child_name("RunnerTweaks");
        this.mainLeaflet.set_visible_child_name("SubView");
    }

    getMenuLayoutName(index){
        for(let styles of Constants.MenuStyles.STYLES){
            for(let style of styles.MENU_TYPE){
                if(style.LAYOUT == index){
                    return _(style.TITLE);
                }
            }
        }
    }

    getMenuLayoutTweaksName(index){
        for(let styles of Constants.MenuStyles.STYLES){
            for(let style of styles.MENU_TYPE){
                if(style.LAYOUT == index){
                    return _("%s Layout Tweaks").format(_(style.TITLE));
                }
            }
        }
    }

    getMenuLayoutImagePath(index){
        for(let styles of Constants.MenuStyles.STYLES){
            for(let style of styles.MENU_TYPE){
                if(style.LAYOUT == index){
                    return style.IMAGE;
                }
            }
        }
    }
});

var LayoutsCategoryPage = GObject.registerClass({
    Signals: {
        'menu-layout-response': { param_types: [GObject.TYPE_INT] },
    },
},  class ArcMenu_LayoutsCategoryPage extends Gtk.Box {
    _init(settings, parent, tile, title) {
        super._init({
            margin_start: 5,
            margin_end: 5,
            spacing: 20,
            orientation: Gtk.Orientation.VERTICAL
        });

        this._parent = parent;
        this._settings = settings;
        this.menuLayout = this._settings.get_enum('menu-layout');
        this.layoutStyle = tile.layout;

        this.maxColumns = tile.layout.length > 3 ? 3 : tile.layout.length;
        this.styles = tile.layout;

        let layoutsFrame = new Adw.PreferencesGroup();
        let layoutsRow = new Adw.PreferencesRow({
            selectable: false,
            activatable: false
        });

        let buttonBox = new Gtk.Box({
            spacing: 10,
            margin_bottom: 10
        });

        this.applyButton = new Gtk.Button({
            label: _("Apply"),
            hexpand: false,
            halign: Gtk.Align.END,
            css_classes: ['suggested-action']
        });

        this.applyButton.connect('clicked', () => {
            this.clearSelection();
            this.emit('menu-layout-response', Gtk.ResponseType.APPLY);
        });

        let backButton = new PW.Button({
            icon_name: 'go-previous-symbolic',
            title: _("Back"),
            icon_first: true,
            halign: Gtk.Align.START,
            css_classes: ['suggested-action']
        });

        backButton.connect('clicked', () => {
            this.clearSelection();
            this.emit('menu-layout-response', Gtk.ResponseType.CANCEL);
        });
        buttonBox.append(backButton);

        let chooseNewLayoutLabel = new Gtk.Label({
            label: "<b>" +  _("%s Menu Layouts").format(_(title)) + "</b>",
            use_markup: true,
            halign: Gtk.Align.CENTER,
            hexpand: true
        });
        buttonBox.append(chooseNewLayoutLabel);
        buttonBox.append(this.applyButton);

        this.applyButton.set_sensitive(false);

        this.append(buttonBox);
        this.append(layoutsFrame);

        this._tileGrid = new Gtk.FlowBox({
            row_spacing: 4,
            column_spacing: 4,
            margin_bottom: 5,
            margin_top: 5,
            hexpand: true,
            halign: Gtk.Align.CENTER,
            max_children_per_line: this.maxColumns,
            homogeneous: true,
            selection_mode: Gtk.SelectionMode.NONE
        });

        this.styles.forEach((style) => {
            this._addTile(style.TITLE, style.IMAGE, style.LAYOUT);
        });
        layoutsRow.set_child(this._tileGrid);
        layoutsFrame.add(layoutsRow);

        this._tileGrid.connect('selected-children-changed', () => {
            this.applyButton.set_sensitive(true);
        });
    }

    clearSelection(){
        if(this.activeButton)
            this.activeButton.active = false;
        this.applyButton.set_sensitive(false);
    }

    _addTile(name, image, layout) {
        let tile = new PW.Tile(name, image, layout);

        if(!this.firstTileButton)
            this.firstTileButton = tile;
        else
            tile.group = this.firstTileButton;

        tile.connect("toggled", () => {
            this.activeButton = tile;
            this.menuLayout = tile.layout;
            this.applyButton.set_sensitive(true);
        });

        this._tileGrid.insert(tile, -1);
    }
});