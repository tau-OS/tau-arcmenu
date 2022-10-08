const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const {Gdk, Gtk} = imports.gi;
const Constants = Me.imports.constants;
const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const Settings = Me.imports.settings;
const { AboutPage } = Settings.AboutPage;
const { GeneralPage } = Settings.GeneralPage;
const { LayoutsPage } = Settings.LayoutsPage;
const { MenuSettingsPage } = Settings.MenuSettingsPage;
const { MiscPage } = Settings.MiscPage;
const { ThemingPage } = Settings.ThemingPage;

function init() {
    ExtensionUtils.initTranslations(Me.metadata['gettext-domain']);
}

function populateWindow(window, settings){
    if(window.pages?.length > 0){
        window.pages.forEach(page => window.remove(page));
    }

    window.pages = [];

    const generalPage = new GeneralPage(settings);
    window.add(generalPage);
    window.pages.push(generalPage);

    const layoutsPage = new LayoutsPage(settings);
    window.add(layoutsPage);
    window.pages.push(layoutsPage);

    const themingPage = new ThemingPage(settings);
    window.add(themingPage);
    window.pages.push(themingPage);

    const menuSettingsPage = new MenuSettingsPage(settings);
    window.add(menuSettingsPage);
    window.pages.push(menuSettingsPage);

    const miscPage = new MiscPage(settings, window);
    window.add(miscPage);
    window.pages.push(miscPage);

    const aboutPage = new AboutPage(settings);
    window.add(aboutPage);
    window.pages.push(aboutPage);

    setVisiblePage(window, settings);
}

function setVisiblePage(window, settings){
    if(settings.get_int('prefs-visible-page') === Constants.PrefsVisiblePage.MAIN){
        window.set_visible_page_name("GeneralPage");
    }
    else if(settings.get_int('prefs-visible-page') === Constants.PrefsVisiblePage.CUSTOMIZE_MENU){
        window.set_visible_page_name("MenuSettingsPage");
        let page = window.get_visible_page();
        page.menuSettingsStackListBox.selectRowByName("MenuSettingsGeneral");
    }
    else if(settings.get_int('prefs-visible-page') === Constants.PrefsVisiblePage.MENU_LAYOUT){
        window.set_visible_page_name("LayoutsPage");
        let page = window.get_visible_page();
        page.displayLayouts();
    }
    else if(settings.get_int('prefs-visible-page') === Constants.PrefsVisiblePage.BUTTON_APPEARANCE){
        window.set_visible_page_name("MenuSettingsPage");
        let page = window.get_visible_page();
        page.menuSettingsStackListBox.selectRowByName("ButtonSettings");
    }
    else if(settings.get_int('prefs-visible-page') === Constants.PrefsVisiblePage.LAYOUT_TWEAKS){
        window.set_visible_page_name("LayoutsPage");
        let page = window.get_visible_page();
        page.displayLayoutTweaksPage();
    }
    else if(settings.get_int('prefs-visible-page') === Constants.PrefsVisiblePage.RUNNER_TWEAKS){
        window.set_visible_page_name("LayoutsPage");
        let page = window.get_visible_page();
        page.displayRunnerTweaksPage();
    }
    else if(settings.get_int('prefs-visible-page') === Constants.PrefsVisiblePage.ABOUT){
        window.set_visible_page_name("AboutPage");
    }
    else if(settings.get_int('prefs-visible-page') === Constants.PrefsVisiblePage.GENERAL){
        window.set_visible_page_name("GeneralPage");
    }
    else if(settings.get_int('prefs-visible-page') === Constants.PrefsVisiblePage.MENU_THEME){
        window.set_visible_page_name("ThemingPage");
    }
    settings.set_int('prefs-visible-page', Constants.PrefsVisiblePage.MAIN);
}

function fillPreferencesWindow(window) {
    let preferences = new Preferences(window);
    window.connect('close-request', () => preferences.destroy());
}

const Preferences = class {
    constructor(window) {
        this._settings = ExtensionUtils.getSettings();

        let iconTheme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default());
        if(!iconTheme.get_search_path().includes(Me.path + "/media/icons/prefs_icons"))
            iconTheme.add_search_path(Me.path + "/media/icons/prefs_icons");

        window.set_search_enabled(true);

        this.pageChangedId = this._settings.connect("changed::prefs-visible-page", () => {
            if(this._settings.get_int('prefs-visible-page') !== Constants.PrefsVisiblePage.MAIN){
                setVisiblePage(window, this._settings);
            }
        });

        window.default_width = this._settings.get_int('settings-width');
        window.default_height = this._settings.get_int('settings-height');
        window.set_title(_("ArcMenu Settings"));

        populateWindow(window, this._settings);
    }

    destroy(){
        if (this.pageChangedId) {
            this._settings.disconnect(this.pageChangedId);
            this.pageChangedId = null;
        }
    }
}