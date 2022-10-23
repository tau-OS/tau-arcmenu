%global extdir %{_datadir}/gnome-shell/extensions/arcmenu@tauos.co

Summary:        ArcMenu is a Dynamic / Traditional / Modern Extension Menu for GNOME, modified for tauOS
Name:           tau-arcmenu
# This should match the version in metadata.json
Version:        39
Release:        3
License:        GPLv2+
URL:            https://github.com/ArcMenu/gnome-shell-extension-arcmenu
Source0:        https://github.com/tau-OS/tau-arcmenu/archive/refs/heads/master.zip
BuildArch:      noarch
BuildRequires:  make
BuildRequires:  gettext
BuildRequires:  sassc
BuildRequires:  %{_bindir}/glib-compile-schemas

Requires:       gnome-shell-extension-common

%description
A Dynamic, Traditional, Modern Menu for GNOME

Features modifications for tauOS.

%prep
%autosetup -n tau-arcmenu-master -Sgit

%install
%make_install UUID=arcmenu@tauos.co INSTALLNAME=arcmenu@tauos.co

# Cleanup crap.
# %{__rm} -fr %{buildroot}%{extdir}/{COPYING*,README*,locale,schemas}

# Create manifest for i18n.
%find_lang %{name} --all-name

%files -f %{name}.lang
%license COPYING
%doc README.md
%{extdir}
# %{_datadir}/glib-2.0/schemas/*gschema.*

%changelog
* Sun Oct 23 2022 Cappy Ishihara <cappy@cappuchino.xyz> - 39-3
- Rebuilt package properly

* Thu Aug 11 2022 Lains <lainsce@airmail.cc> - 48.2-1
- Initial Release
