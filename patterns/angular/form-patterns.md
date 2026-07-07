# Form Patterns

## Intent

Define Angular reactive forms patterns: typed forms, custom validators, async validation, dynamic forms, cross-field validation, and form architecture.

## Problem

Forms are the most interaction-heavy part of Angular applications. Without patterns, forms become unmaintainable: validation logic is scattered, types are lost, async flows are hard to manage, and dynamic forms are impossible to navigate.

## Approach

### Reactive Forms (FormGroup, FormArray, FormBuilder)

Always use reactive forms over template-driven forms. They provide testability, type safety, and programmatic control.

```typescript
@Component({ standalone: true, ... })
export class BookFormComponent {
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    author: ['', Validators.required],
    isbn: ['', [Validators.pattern(/^\d{10}|\d{13}$/)]],
    chapters: this.fb.array([
      this.fb.group({ name: '', pages: [0, Validators.min(1)] }),
    ]),
  });

  get chapters() { return this.form.controls.chapters as FormArray; }

  addChapter() {
    this.chapters.push(this.fb.group({ name: '', pages: [0, Validators.min(1)] }));
  }

  removeChapter(index: number) {
    this.chapters.removeAt(index);
  }

  submit() {
    if (this.form.invalid) return;
    console.log(this.form.value); // typed as BookForm
  }
}
```

### Typed Forms (Angular 14+)

Angular 14 introduced typed forms. `FormBuilder` with `nonNullable` provides strict types:

```typescript
interface BookForm {
  title: string;
  author: string;
  isbn: string;
  chapters: { name: string; pages: number }[];
}

// FormGroup type is inferred as FormGroup<{
//   title: FormControl<string>;
//   author: FormControl<string>;
//   isbn: FormControl<string>;
//   chapters: FormArray<FormGroup<{ name: FormControl<string>; pages: FormControl<number> }>>;
// }>
```

**Never use `FormGroup` without a type parameter.** Always use `FormBuilder` with `nonNullable` to avoid `string | null` types.

### Custom Validators

**Field-level:**

```typescript
export function isbnValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const isValid = /^\d{10}|\d{13}$/.test(value);
    return isValid ? null : { invalidIsbn: { value } };
  };
}
```

**Factory validators (with parameters):**

```typescript
export function rangeValidator(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value == null || value === '') return null;
    return value >= min && value <= max ? null : { range: { min, max, actual: value } };
  };
}
```

### Async Validators

Use for server-side validation (e.g., unique username):

```typescript
export function uniqueIsbnValidator(service: BookService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) return of(null);
    return control.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(value => service.checkIsbn(value)),
      map(isTaken => isTaken ? { isbnTaken: true } : null),
      first(),
    );
  };
}
```

Apply with `asyncValidators` (not mixed into `validators`):

```typescript
isbn: ['', [Validators.required], [uniqueIsbnValidator(bookService)]],
```

### Dynamic Forms Pattern

For forms built from a configuration object (e.g., from a JSON schema):

```typescript
interface FieldConfig {
  key: string;
  type: 'text' | 'number' | 'select' | 'checkbox';
  label: string;
  validators?: ValidatorFn[];
  options?: { label: string; value: unknown }[];
}

@Directive({
  selector: '[appDynamicField]',
  standalone: true,
})
export class DynamicFieldDirective {
  @Input() config!: FieldConfig;
  @Input() control!: FormControl;
}
```

```typescript
@Component({ ... })
export class DynamicFormComponent {
  @Input({ required: true }) fields!: FieldConfig[];
  form = this.fb.group({});

  ngOnInit() {
    const group: Record<string, FormControl> = {};
    for (const field of this.fields) {
      group[field.key] = new FormControl('', field.validators);
    }
    this.form = this.fb.group(group);
  }
}
```

### Form-Level vs Field-Level Validation

**Field-level:** Validates individual fields. Use for format checks, required, min/max length.

**Form-level (cross-field):** Validates relationships between fields.

```typescript
export function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const confirm = control.get('confirmPassword');
    if (!password || !confirm) return null;
    return password.value === confirm.value ? null : { passwordMismatch: true };
  };
}
```

Apply to the `FormGroup`:

```typescript
this.form = this.fb.group({ ... }, { validators: [passwordMatchValidator()] });
```

### Cross-Field Validation

For complex cross-field logic (e.g., end date after start date):

```typescript
export function dateRangeValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;
    if (!start || !end) return null;
    return new Date(end) > new Date(start) ? null : { dateRange: true };
  };
}
```

Display errors in the template:

```html
<div *ngIf="form.hasError('dateRange')">End date must be after start date</div>
```

## Trade-offs

| Pattern | Pros | Cons |
|---------|------|------|
| Reactive forms | Type-safe, testable, dynamic | More boilerplate than template-driven |
| Typed forms | Full type inference, no null unions | Requires `nonNullable`, no `FormBuilder` partial support |
| Async validators | Server-side validation, debounced | Adds latency, must clean up subscriptions |
| Dynamic forms | Data-driven, reusable | Complex template, harder to customize per field |
| Cross-field validators | Coherent validation logic | Error display is not field-specific |

## Best Practices

- Always use reactive forms with `FormBuilder` and `nonNullable`.
- Use typed forms — never use `FormGroup` without type inference.
- Keep validators as pure functions in separate files.
- Debounce async validators and use `switchMap` to cancel in-flight requests.
- Use `FormArray` for dynamic lists — never manually manage dynamic controls.
- Apply cross-field validators as `FormGroup` validators, not field-level.
- Use `markAllAsTouched()` on submit to show all validation errors.
- Use `valueChanges` with `distinctUntilChanged` and `debounceTime` for reactive form interactions.
- Signal-based forms: consider `form.valueChanges` piped through `toSignal` for reactive reads.
- Test validators as pure functions, not through component TestBed.