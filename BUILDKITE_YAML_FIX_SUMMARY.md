# Buildkite YAML Format Fixes

## Issues Fixed

### 1. Soft Fail Format
**Problem**: The `soft_fail` attribute must be either `true`, `false`, or an array of objects with `exit_status` properties.

**Before (Invalid)**:
```yaml
soft_fail:
  exit_status:
    - 1
    - 2
```

**After (Valid)**:
```yaml
# Boolean format
soft_fail: true

# Array format for specific exit codes
soft_fail:
  - exit_status: 1
  - exit_status: 2
```

**Code Changes**: Updated `yaml-generator.js` to:
- Handle boolean values (`true`/`false`)
- Convert array of numbers `[1, 2, 3]` to proper format
- Convert object format `{ exit_status: [1, 2] }` to proper format
- Generate correct array of objects format

### 2. Block/Input Field Format
**Problem**: Field types in block/input steps must be specified using the field type as the property name (`text:` or `select:`), not as a `type` property.

**Before (Invalid)**:
```yaml
fields:
  - key: environment
    text: Environment
    type: select
    options:
      - label: Staging
        value: staging
```

**After (Valid)**:
```yaml
# Text field
fields:
  - text: "Deployment Notes"
    key: deployment_notes
    hint: "Any special instructions?"
    required: false

# Select field  
fields:
  - select: "Environment"
    key: environment
    required: true
    options:
      - label: Staging
        value: staging
      - label: Production
        value: production
```

**Code Changes**: Updated `generateField()` method to:
- Use `text:` or `select:` as the field type property
- Only include `options` for select fields
- Support `multiple: true` for multi-select fields
- Properly format default values for multi-select

### 3. Field Properties
**Text fields** can have:
- `key` (required)
- `text` (the label)
- `hint`
- `required`
- `default`

**Select fields** can have:
- `key` (required)
- `select` (the label)
- `hint`
- `required`
- `default` (string or array for multiple)
- `multiple` (boolean)
- `options` (required, array of `{label, value}`)

## Test Files Created

1. **test-buildkite-yaml-validation.html** - Comprehensive tests showing:
   - Correct soft_fail formats
   - Text fields without options
   - Select fields with options
   - Complete pipeline examples

## Result

The YAML generator now produces valid Buildkite YAML that conforms to the official documentation requirements.