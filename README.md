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