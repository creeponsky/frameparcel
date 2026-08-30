# Contributing

Thanks for helping improve FrameParcel.

## Local checks

Before opening a pull request, run:

```bash
npm ci
npm run check
npm run build
npm run test:sandbox
npm audit --audit-level=high
```

When changing export behavior, also import the development plugin in Figma Desktop and validate a real ZIP:

```bash
npm run validate-export -- /absolute/path/to/export.zip
```

Please describe the selected Figma node type and the observed export boundary without attaching proprietary design files.
