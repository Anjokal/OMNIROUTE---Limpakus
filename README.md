  

OMNIROUTE-LIMPAKUS
INSTALL/UNISTALL GUIDE
Version 8.0

Author / Contact:
Omniroute-LIMPAKUS // ROOT ACCESS LAB
limpakus@gmail.com


WHAT THIS EXTENSION DOES AND WHY IT WAS CREATED
======================================================================

Omniroute-LIMPAKUS is a local Chrome extension created to simplify the manual
collection and formatting of session credentials required by OmniRoute Web
providers. It detects supported AI platforms, reads only the credential type
needed for the selected provider, and copies the result to the clipboard so it
can be pasted into OmniRoute.

The extension was created because each AI platform stores authentication data
differently: cookies, Local Storage values, bearer tokens, or complete request
headers. Omniroute-LIMPAKUS provides one consistent interface for these
different methods and reduces repetitive work when configuring several Web
providers on a personal computer.

It is intended only for accounts, browsers, devices and systems owned by the
user or for which the user has explicit authorization.

Omniroute-LIMPAKUS has zero external communication. 
All credential processing occurs locally inside the user's browser.


HOW TO USE
======================================================================

INSTALL
-------
1. Extract the ZIP archive to a permanent folder.
2. Open Google Chrome.
3. Enter chrome://extensions in the address bar.
4. Enable Developer mode.
5. Click Load unpacked.
6. Select the extension folder.
7. Optionally pin Omniroute-LIMPAKUS to the Chrome toolbar.

UNISTALL
--------
1. Open chrome://extensions.
2. Find Omniroute-LIMPAKUS.
3. Click Remove.
4. Confirm removal.
5. Delete the extracted folder if it is no longer needed.



SECURITY RECOMMENDATION
======================================================================

For maximum security, it is recommended to remove the Omniroute-LIMPAKUS
extension from the browser after completing the OmniRoute Web provider
configuration.

Temporary captured headers/cookies are automatically removed after 10 minutes.
Use 'Clear captured data' after configuration. Clipboard credentials should be overwritten after use.

Although all credential processing is performed locally and no data is sent
to external servers, the extension has access to sensitive browser session
information required for credential extraction. Keeping the extension
installed unnecessarily increases the potential attack surface, especially
on shared computers or environments where other users may have access to
the same browser profile.

After completing the configuration, remove the extension and keep only the
generated OmniRoute configuration required for your own authorized account.
The extension can always be installed again when a new provider configuration
is required.



LEGAL NOTICE
======================================================================

Use this extension only with accounts and systems that belong to you or
for which you have explicit authorization.

The user is solely responsible for compliance with applicable law,
platform terms, internal policies and third-party rights.

Prohibited uses include unauthorized access, credential theft,
surveillance, fraud, bypassing security controls and any unlawful or
abusive activity.

The software is provided "as is", without warranty. The author is not
responsible for misuse, blocked accounts, data loss, service interruption,
contractual breaches or direct or indirect consequences resulting from
improper use.



SCREENSHOTS
======================================================================

<img width="1823" height="428" alt="{406FA618-76AD-45EB-8248-4C7C582D6056}" src="https://github.com/user-attachments/assets/16a90a2f-b3c5-4a69-8e44-7ffcf5b7b1e3" />

======================================================================


<img width="560" height="625" alt="image" src="https://github.com/user-attachments/assets/d5b0c436-3b95-4ffc-8203-87c1740087ab" />


======================================================================


<img width="560" height="573" alt="image" src="https://github.com/user-attachments/assets/51b51bc8-854c-4c80-8d01-da4df33f4cb7" />


======================================================================


<img width="552" height="799" alt="image" src="https://github.com/user-attachments/assets/fae0d090-9695-4940-85f5-fa3d207f3538" />


