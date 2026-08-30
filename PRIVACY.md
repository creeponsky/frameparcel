# FrameParcel privacy policy

Last updated: 2026-08-30

FrameParcel processes Figma design data only inside the Figma plugin runtime to create a ZIP file that the user explicitly downloads to their computer.

FrameParcel:

- does not send design data, assets, metadata, or usage information to a server;
- does not use analytics, telemetry, advertising, cookies, or tracking identifiers;
- does not require an account, API token, or external service;
- does not store exported packages outside the user's computer;
- declares `networkAccess.allowedDomains` as `none` in its Figma manifest.

The exported ZIP may contain design previews, node properties, text, image fills, and SVG assets from the scope selected by the user. Users are responsible for sharing or storing that local ZIP in accordance with their organization's policies and the rights attached to the source design and fonts.

Font names and styles may be recorded, but FrameParcel does not copy licensed font files.

For questions or security reports, open an issue at <https://github.com/creeponsky/frameparcel/issues>.
