<<<<<<< HEAD
cv-pls
======

This Google Chrome extension will help you close voting questions on Stack Overflow.

It will convert all [cv-pls] and [delv-pls] requests into nice oneboxes in the SO chat.

[Download current stable version (0.19.0)][1]

NOTE: If you've updated chrome past [Revision 137699][2], you'll have to drag the .crx file into the chrome://extensions window to install it.

Usage
-----

Simply install the plugin and all [cv-pls] or [delv-pls] requests will automatically be converted into formatted oneboxes.

Settings
--------

- Enable/disable addressbar icon
- Enable/disable @mention beep notification
- Enable/disable avatar notifications (like mentions and flags)
- Enable/disable formatting in oneboxes
- Changing the (initial) height of the oneboxes
- Enable/disable displaying of the close status
- Enable/disable polling of close status (please note that there is a requests quota of 10000)
- Enable backlog in chat
- Dupes helper

[1]:https://github.com/downloads/cv-pls/cv-pls/cv-pls.0.19.0.crx
[2]:http://src.chromium.org/viewvc/chrome?view=rev&revision=137699
=======
[cv-pls]
========

This browser extension will help you close voting questions on Stack Overflow.

It will convert all [cv-pls] and [delv-pls] requests into nice oneboxes in the SO chat.

This repository holds the core application code, in order to use it you will need to use one of the browser-specific wrappers. Currently the following wrappers are available:

<table>
  <tr>
    <th>Browser</th>
    <th>Stable</th>
    <th>Development</th>
  </tr>
  <tr>
    <td><a href="https://github.com/cv-pls/chrome-cv-pls">Google Chrome</a></td>
    <td><a href="https://github.com/downloads/cv-pls/chrome-cv-pls/cv-pls_0.19.0.crx">0.19.0</a></td>
    <td><a href="https://github.com/downloads/cv-pls/chrome-cv-pls/cv-pls_0.20-beta1.crx">0.20-beta1</a></td>
  </tr>
  <tr>
    <td><a href="https://github.com/cv-pls/ff-cv-pls">Mozilla Firefox</a></td>
    <td><i>None</i></td>
    <td><a href="https://github.com/downloads/cv-pls/ff-cv-pls/cv-pls_0.20-beta1.xpi">0.20-beta1</a></td>
  </tr>
</table>

Please see the relevant project for browser-specific notes and installation instructions.

Feature Overview
----------------

- Turn [cv-pls] and [delv-pls] requests into oneboxes
- Convenience buttons for creating [cv-pls] and [delv-pls] requests
- Various options for being notified of new requests, including @mention beep and avatar notifications
- Integration with the [CVBacklog][1]
- Request progress indication in oneboxes and/or by striking through completed requests

[1]:https://github.com/gooh/CVBacklog
>>>>>>> 3146b57a2603ff7d0f1daaa38eb5926abcee537a
