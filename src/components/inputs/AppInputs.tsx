// src/components/inputs/AppInputs.tsx
"use client";

import * as React from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// shadcn form wrappers (para zod + react-hook-form)
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
} from "@/components/ui/form";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import type { CheckedState } from "@radix-ui/react-checkbox";

import type { Control, FieldValues, Path } from "react-hook-form";

/* ============================================================================
   Responsive helper: mq puede ser number(px) o tailwind key
============================================================================ */

type TailwindBp = "sm" | "md" | "lg" | "xl" | "2xl";
type Breakpoint = number | TailwindBp;

const TW_BP_PX: Record<TailwindBp, number> = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
};

function breakpointToPx(mq?: Breakpoint): number {
    if (mq == null) return TW_BP_PX.md;
    if (typeof mq === "number") return mq;
    return TW_BP_PX[mq] ?? TW_BP_PX.md;
}

function useIsomorphicLayoutEffect(
    effect: React.EffectCallback,
    deps: React.DependencyList
) {
    const useIso =
        typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;
    useIso(effect, deps);
}

function useIsMinWidth(mq?: Breakpoint) {
    const px = breakpointToPx(mq);

    // Valor inicial correcto (primer render cliente)
    const [ok, setOk] = React.useState<boolean>(() => {
        if (typeof window === "undefined") return false;
        return window.matchMedia(`(min-width: ${px}px)`).matches;
    });

    useIsomorphicLayoutEffect(() => {
        if (typeof window === "undefined") return;

        const mql = window.matchMedia(`(min-width: ${px}px)`);

        const update = (): void => {
            setOk(mql.matches);
        };

        // sincronizamos por si px cambió
        update();

        // ✅ API moderna (no deprecated)
        mql.addEventListener("change", update);
        return () => {
            mql.removeEventListener("change", update);
        };
    }, [px]);

    return ok;
}


/* ============================================================================
   Tipos base
============================================================================ */

type Dim = string; // "36px", "100%", "2.5rem", "clamp(...)"
type Variant = "default" | "ghost" | "danger";

type BaseStyleProps = {
    height?: Dim;
    width?: Dim;

    // valores cuando se cumple el media query "mq"
    mq?: Breakpoint;
    mqHeight?: Dim;
    mqWidth?: Dim;

    background?: string;
    textColor?: string;
};

type FieldChrome = {
    label?: string;
    description?: string;
    error?: string | null;
    required?: boolean;
};

type SlotProps = {
    leftSlot?: React.ReactNode;
    rightSlot?: React.ReactNode;
};

type BehaviorProps = {
    variant?: Variant;
    loading?: boolean;
};

type CommonProps = BaseStyleProps &
    FieldChrome &
    SlotProps &
    BehaviorProps & {
        className?: string; // wrapper
        inputClassName?: string; // input/textarea
        placeholder?: string;
    };

type SelectOption = {
    label: string;
    value: string;
    disabled?: boolean;
};

type SelectUIProps = CommonProps & {
    options: SelectOption[];
    value?: string; // controlled
    onValueChange?: (value: string) => void;
};

function triggerBaseClasses(variant: Variant, hasError: boolean) {
    return cn(
        "w-full h-9",
        "text-slate-100",
        "border",
        "focus:outline-none focus:ring-2",
        hasError ? variantInputClasses("danger") : variantInputClasses(variant)
    );
}

function variantInputClasses(variant: Variant) {
    switch (variant) {
        case "ghost":
            return "bg-transparent border-slate-700/60 hover:border-slate-600 focus-visible:ring-slate-600";
        case "danger":
            return "border-red-500/60 focus-visible:ring-red-700";
        default:
            return "bg-slate-950 border-slate-700 focus-visible:ring-slate-700";
    }
}

function useResponsiveDims(
    props: Pick<BaseStyleProps, "height" | "width" | "mq" | "mqHeight" | "mqWidth">
) {
    const isMq = useIsMinWidth(props.mq);
    return {
        height: isMq ? (props.mqHeight ?? props.height) : props.height,
        width: isMq ? (props.mqWidth ?? props.width) : props.width,
    };
}

/* ============================================================================
   Wrapper “visual” (sin RHF)
============================================================================ */

function SimpleFieldWrapper({
    label,
    description,
    error,
    required,
    className,
    children,
}: {
    label?: string;
    description?: string;
    error?: string | null;
    required?: boolean;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={cn("space-y-1.5", className)}>
            {label && (
                <label className="text-sm text-slate-200">
                    {label} {required ? <span className="text-red-300">*</span> : null}
                </label>
            )}
            {children}
            {description && !error ? (
                <p className="text-xs text-slate-400">{description}</p>
            ) : null}
            {error ? <p className="text-xs text-red-400">{error}</p> : null}
        </div>
    );
}

/* ============================================================================
   BaseInput + variantes
============================================================================ */

type BaseInputProps = CommonProps &
    Omit<React.ComponentProps<typeof Input>, "type" | "className" | "placeholder"> & {
        type: React.HTMLInputTypeAttribute;
    };

export const BaseInput = React.forwardRef<HTMLInputElement, BaseInputProps>(function BaseInput(
    {
        type,
        className,
        inputClassName,
        placeholder,
        label,
        description,
        error,
        required,
        leftSlot,
        rightSlot,
        variant = "default",
        loading = false,
        height,
        width,
        mq,
        mqHeight,
        mqWidth,
        background,
        textColor,
        style,
        disabled,
        ...props
    },
    ref
) {
    const dims = useResponsiveDims({ height, width, mq, mqHeight, mqWidth });
    const hasRight = Boolean(rightSlot) || loading;

    return (
        <SimpleFieldWrapper
            className={className}
            label={label}
            description={description}
            error={error}
            required={required}
        >
            <div className="relative">
                {leftSlot ? (
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                        {leftSlot}
                    </div>
                ) : null}

                <Input
                    ref={ref}
                    type={type}
                    placeholder={placeholder}
                    disabled={disabled || loading}
                    className={cn(
                        "text-slate-100 placeholder:text-slate-500 focus-visible:ring-2",
                        variantInputClasses(error ? "danger" : variant),
                        leftSlot ? "pl-10" : "",
                        hasRight ? "pr-10" : "",
                        inputClassName
                    )}
                    style={{
                        ...style,
                        height: dims.height,
                        width: dims.width,
                        backgroundColor: background,
                        color: textColor,
                    }}
                    {...props}
                />

                {loading ? (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/80">
                        <Loader2 className="h-[18px] w-[18px] animate-spin" />
                    </div>
                ) : rightSlot ? (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        {rightSlot}
                    </div>
                ) : null}
            </div>
        </SimpleFieldWrapper>
    );
});

type SimpleInputProps = Omit<BaseInputProps, "type">;

export const TextInput = React.forwardRef<HTMLInputElement, SimpleInputProps>((p, ref) => (
    <BaseInput ref={ref} type="text" {...p} />
));
TextInput.displayName = "TextInput";

export const EmailInput = React.forwardRef<HTMLInputElement, SimpleInputProps>((p, ref) => (
    <BaseInput ref={ref} type="email" autoComplete="email" {...p} />
));
EmailInput.displayName = "EmailInput";

export const NumberInput = React.forwardRef<HTMLInputElement, SimpleInputProps>((p, ref) => (
    <BaseInput ref={ref} type="number" inputMode="numeric" {...p} />
));
NumberInput.displayName = "NumberInput";

export const DateInput = React.forwardRef<HTMLInputElement, SimpleInputProps>((p, ref) => (
    <BaseInput ref={ref} type="date" {...p} />
));
DateInput.displayName = "DateInput";

/* ============================================================================
   PasswordInput con tu ojito (blanco)
============================================================================ */

type PasswordInputProps = CommonProps &
    Omit<React.ComponentProps<typeof Input>, "type" | "className" | "placeholder">;

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
    {
        className,
        inputClassName,
        placeholder,
        label,
        description,
        error,
        required,
        leftSlot,
        variant = "default",
        loading = false,
        height,
        width,
        mq,
        mqHeight,
        mqWidth,
        background,
        textColor,
        style,
        disabled,
        ...props
    },
    ref
) {
    const [show, setShow] = React.useState(false);
    const dims = useResponsiveDims({ height, width, mq, mqHeight, mqWidth });

    return (
        <SimpleFieldWrapper
            className={className}
            label={label}
            description={description}
            error={error}
            required={required}
        >
            <div className="relative">
                {leftSlot ? (
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                        {leftSlot}
                    </div>
                ) : null}

                <Input
                    ref={ref}
                    type={show ? "text" : "password"}
                    placeholder={placeholder}
                    disabled={disabled || loading}
                    className={cn(
                        "text-slate-100 placeholder:text-slate-500 focus-visible:ring-2",
                        variantInputClasses(error ? "danger" : variant),
                        leftSlot ? "pl-10" : "",
                        "pr-10",
                        inputClassName
                    )}
                    style={{
                        ...style,
                        height: dims.height,
                        width: dims.width,
                        backgroundColor: background,
                        color: textColor,
                    }}
                    {...props}
                />

                {loading ? (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/80">
                        <Loader2 className="h-[18px] w-[18px] animate-spin" />
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setShow((v) => !v)}
                        className="
              absolute right-2 top-1/2 -translate-y-1/2
              rounded-md p-1
              text-white opacity-85 hover:opacity-100
              hover:bg-white/10
              focus:outline-none
            "
                        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                        {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
        </SimpleFieldWrapper>
    );
});

/* ============================================================================
   TextareaInput (simple)
============================================================================ */

type TextareaInputProps = CommonProps &
    Omit<React.ComponentProps<typeof Textarea>, "className" | "placeholder">;

export function TextareaInput({
    className,
    inputClassName,
    placeholder,
    label,
    description,
    error,
    required,
    variant = "default",
    loading = false,
    height,
    width,
    mq,
    mqHeight,
    mqWidth,
    background,
    textColor,
    style,
    disabled,
    ...props
}: TextareaInputProps) {
    const dims = useResponsiveDims({ height, width, mq, mqHeight, mqWidth });

    return (
        <SimpleFieldWrapper
            className={className}
            label={label}
            description={description}
            error={error}
            required={required}
        >
            <Textarea
                placeholder={placeholder}
                disabled={disabled || loading}
                className={cn(
                    "text-slate-100 placeholder:text-slate-500 focus-visible:ring-2",
                    variantInputClasses(error ? "danger" : variant),
                    inputClassName
                )}
                style={{
                    ...style,
                    minHeight: dims.height,
                    width: dims.width,
                    backgroundColor: background,
                    color: textColor,
                }}
                {...props}
            />
        </SimpleFieldWrapper>
    );
}

/* ============================================================================
   Select / Switch / Checkbox (simple)
============================================================================ */

export function SelectField({
    className,
    inputClassName,
    label,
    description,
    error,
    required,
    options,
    value,
    onValueChange,
    placeholder = "Seleccioná una opción",
    variant = "default",
    loading = false,
    height,
    width,
    mq,
    mqHeight,
    mqWidth,
}: SelectUIProps) {
    const dims = useResponsiveDims({ height, width, mq, mqHeight, mqWidth });

    return (
        <SimpleFieldWrapper
            className={className}
            label={label}
            description={description}
            error={error}
            required={required}
        >
            <Select value={value ?? ""} onValueChange={onValueChange} disabled={loading}>
                <SelectTrigger
                    className={cn(triggerBaseClasses(variant, Boolean(error)), inputClassName)}
                    style={{ height: dims.height, width: dims.width }}
                >
                    <SelectValue placeholder={loading ? "Cargando..." : placeholder} />
                </SelectTrigger>

                <SelectContent className="bg-slate-900 border-slate-700 text-slate-100 max-h-64">
                    {options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </SimpleFieldWrapper>
    );
}

type SwitchFieldProps = Omit<CommonProps, "placeholder" | "leftSlot" | "rightSlot"> & {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
};

export function SwitchField({
    className,
    label,
    description,
    error,
    required,
    checked,
    onCheckedChange,
    loading = false,
}: SwitchFieldProps) {
    return (
        <SimpleFieldWrapper
            className={className}
            label={label}
            description={description}
            error={error}
            required={required}
        >
            <div className="flex items-center gap-3">
                <Switch
                    checked={Boolean(checked)}
                    onCheckedChange={onCheckedChange}
                    disabled={loading}
                />
                {loading ? <span className="text-xs text-slate-400">Actualizando...</span> : null}
            </div>
        </SimpleFieldWrapper>
    );
}

type CheckboxFieldProps = Omit<CommonProps, "placeholder" | "leftSlot" | "rightSlot"> & {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
};

export function CheckboxField({
    className,
    label,
    description,
    error,
    required,
    checked,
    onCheckedChange,
    loading = false,
}: CheckboxFieldProps) {
    return (
        <SimpleFieldWrapper
            className={className}
            label={undefined}
            description={description}
            error={error}
            required={required}
        >
            <div className="flex items-start gap-3">
                <Checkbox
                    checked={Boolean(checked)}
                    onCheckedChange={(v: CheckedState) => onCheckedChange?.(v === true)}
                    disabled={loading}
                />
                <div className="space-y-0.5">
                    {label ? (
                        <label className="text-sm text-slate-200">
                            {label} {required ? <span className="text-red-300">*</span> : null}
                        </label>
                    ) : null}
                    {error ? <p className="text-xs text-red-400">{error}</p> : null}
                </div>
            </div>
        </SimpleFieldWrapper>
    );
}

type SelectNumberFieldProps = Omit<SelectUIProps, "value" | "onValueChange"> & {
    value?: number | null;
    onValueChange?: (value: number | null) => void;
    emptyValue?: number | null; // default null
};

export function SelectNumberField({
    value,
    onValueChange,
    emptyValue = null,
    options,
    ...ui
}: SelectNumberFieldProps) {
    return (
        <SelectField
            {...ui}
            options={options}
            value={value != null ? String(value) : ""}
            onValueChange={(v) => {
                if (!v) return onValueChange?.(emptyValue);
                const n = Number(v);
                onValueChange?.(Number.isFinite(n) ? n : emptyValue);
            }}
        />
    );
}

/* ============================================================================
   RHF wrappers (Zod-friendly)
   IMPORTANTE: para evitar duplicados, el label/description/error se pintan SOLO acá
============================================================================ */

type RHFBaseProps<T extends FieldValues> = Omit<CommonProps, "error"> & {
    control: Control<T>;
    name: Path<T>;
};

type RHFUiProps<T extends FieldValues> = Omit<RHFBaseProps<T>, "control" | "name">;

function splitRHFUiProps<T extends FieldValues>(ui: RHFUiProps<T>) {
    const { label, description, required, ...rest } = ui;
    return {
        label,
        description,
        required,
        inputUi: rest,
    };
}


export function FormTextInput<T extends FieldValues>({ control, name, ...ui }: RHFBaseProps<T>) {
    const { label, description, required, inputUi } = splitRHFUiProps(ui);

    return (
        <FormField
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <FormItem className={ui.className}>
                    {label ? <FormLabel>{label}{required ? " *" : ""}</FormLabel> : null}
                    <FormControl>
                        <TextInput
                            {...(inputUi as any)}
                            className={undefined}
                            label={undefined}
                            description={undefined}
                            error={undefined}
                            required={undefined}
                            value={(field.value ?? "") as any}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            // el estilo de error visual del input lo resolvemos con variant
                            variant={fieldState.error ? "danger" : (ui.variant ?? "default")}
                        />
                    </FormControl>
                    {description ? <FormDescription>{description}</FormDescription> : null}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

export function FormPasswordInput<T extends FieldValues>({ control, name, ...ui }: RHFBaseProps<T>) {
    const { label, description, required, inputUi } = splitRHFUiProps(ui);

    return (
        <FormField
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <FormItem className={ui.className}>
                    {label ? <FormLabel>{label}{required ? " *" : ""}</FormLabel> : null}
                    <FormControl>
                        <PasswordInput
                            {...(inputUi as any)}
                            className={undefined}
                            label={undefined}
                            description={undefined}
                            error={undefined}
                            required={undefined}
                            value={(field.value ?? "") as any}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            variant={fieldState.error ? "danger" : (ui.variant ?? "default")}
                        />
                    </FormControl>
                    {description ? <FormDescription>{description}</FormDescription> : null}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

export function FormDateInput<T extends FieldValues>({ control, name, ...ui }: RHFBaseProps<T>) {
    const { label, description, required, inputUi } = splitRHFUiProps(ui);

    return (
        <FormField
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <FormItem className={ui.className}>
                    {label ? <FormLabel>{label}{required ? " *" : ""}</FormLabel> : null}
                    <FormControl>
                        <DateInput
                            {...(inputUi as any)}
                            className={undefined}
                            label={undefined}
                            description={undefined}
                            error={undefined}
                            required={undefined}
                            value={(field.value ?? "") as any}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            variant={fieldState.error ? "danger" : (ui.variant ?? "default")}
                        />
                    </FormControl>
                    {description ? <FormDescription>{description}</FormDescription> : null}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

export function FormEmailInput<T extends FieldValues>({ control, name, ...ui }: RHFBaseProps<T>) {
    const { label, description, required, inputUi } = splitRHFUiProps(ui);

    return (
        <FormField
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <FormItem className={ui.className}>
                    {label ? <FormLabel>{label}{required ? " *" : ""}</FormLabel> : null}
                    <FormControl>
                        <EmailInput
                            {...(inputUi as any)}
                            className={undefined}
                            label={undefined}
                            description={undefined}
                            error={undefined}
                            required={undefined}
                            value={(field.value ?? "") as any}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            variant={fieldState.error ? "danger" : (ui.variant ?? "default")}
                        />
                    </FormControl>
                    {description ? <FormDescription>{description}</FormDescription> : null}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

export function FormNumberInput<T extends FieldValues>({ control, name, ...ui }: RHFBaseProps<T>) {
    const { label, description, required, inputUi } = splitRHFUiProps(ui);

    return (
        <FormField
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <FormItem className={ui.className}>
                    {label ? <FormLabel>{label}{required ? " *" : ""}</FormLabel> : null}
                    <FormControl>
                        <NumberInput
                            {...(inputUi as any)}
                            className={undefined}
                            label={undefined}
                            description={undefined}
                            error={undefined}
                            required={undefined}
                            value={(field.value ?? "") as any}
                            onChange={(e) => field.onChange(e)}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            variant={fieldState.error ? "danger" : (ui.variant ?? "default")}
                        />
                    </FormControl>
                    {description ? <FormDescription>{description}</FormDescription> : null}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

type RHFGenericInputProps<T extends FieldValues> = Omit<RHFBaseProps<T>, "name"> & {
    name: Path<T>;
    type: React.HTMLInputTypeAttribute;
};

export function FormInput<T extends FieldValues>({ control, name, type, ...ui }: RHFGenericInputProps<T>) {
    const { label, description, required, inputUi } = splitRHFUiProps(ui as any);

    return (
        <FormField
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <FormItem className={ui.className}>
                    {label ? <FormLabel>{label}{required ? " *" : ""}</FormLabel> : null}
                    <FormControl>
                        <BaseInput
                            {...(inputUi as any)}
                            className={undefined}
                            label={undefined}
                            description={undefined}
                            error={undefined}
                            required={undefined}
                            type={type}
                            value={(field.value ?? "") as any}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            variant={fieldState.error ? "danger" : (ui.variant ?? "default")}
                        />
                    </FormControl>
                    {description ? <FormDescription>{description}</FormDescription> : null}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

type RHFSelectProps<T extends FieldValues> = Omit<RHFBaseProps<T>, "error"> & {
    options: SelectOption[];
    placeholder?: string;
};

export function FormSelectField<T extends FieldValues>({ control, name, ...ui }: RHFSelectProps<T>) {
    // ojo: SelectField también tiene wrapper visual
    // entonces hacemos lo mismo: label/description con shadcn, y al SelectField NO le pasamos label/description/error
    const { label, description, required, inputUi } = splitRHFUiProps(ui as any);

    return (
        <FormField
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <FormItem className={ui.className}>
                    {label ? <FormLabel>{label}{required ? " *" : ""}</FormLabel> : null}
                    <FormControl>
                        <SelectField
                            {...(inputUi as any)}
                            className={undefined}
                            label={undefined}
                            description={undefined}
                            error={undefined}
                            required={undefined}
                            options={ui.options}
                            placeholder={ui.placeholder}
                            value={field.value != null ? String(field.value) : ""}
                            onValueChange={(v) => field.onChange(v)}
                            variant={fieldState.error ? "danger" : (ui.variant ?? "default")}
                        />
                    </FormControl>
                    {description ? <FormDescription>{description}</FormDescription> : null}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

export function FormSwitchField<T extends FieldValues>({ control, name, ...ui }: RHFBaseProps<T>) {
    const { label, description, required, inputUi } = splitRHFUiProps(ui);

    return (
        <FormField
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <FormItem className={ui.className}>
                    {label ? <FormLabel>{label}{required ? " *" : ""}</FormLabel> : null}
                    <FormControl>
                        <SwitchField
                            {...(inputUi as any)}
                            className={undefined}
                            label={undefined}
                            description={undefined}
                            error={undefined}
                            required={undefined}
                            checked={Boolean(field.value)}
                            onCheckedChange={(v) => field.onChange(v)}
                        />
                    </FormControl>
                    {description ? <FormDescription>{description}</FormDescription> : null}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

export function FormCheckboxField<T extends FieldValues>({ control, name, ...ui }: RHFBaseProps<T>) {
    // CheckboxField muestra label/error internos si se los pasas,
    // así que en RHF: label + message afuera, y al CheckboxField NO le pasamos label/error/description.
    const { label, description, required, inputUi } = splitRHFUiProps(ui);

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem className={ui.className}>
                    {label ? <FormLabel>{label}{required ? " *" : ""}</FormLabel> : null}
                    <FormControl>
                        <CheckboxField
                            {...(inputUi as any)}
                            className={undefined}
                            label={undefined}
                            description={undefined}
                            error={undefined}
                            required={undefined}
                            checked={Boolean(field.value)}
                            onCheckedChange={(v) => field.onChange(v)}
                        />
                    </FormControl>
                    {description ? <FormDescription>{description}</FormDescription> : null}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

type RHFSelectNumberProps<T extends FieldValues> = Omit<RHFBaseProps<T>, "error"> & {
    options: SelectOption[];
    placeholder?: string;
    emptyValue?: number | null;
};

export function FormSelectNumberField<T extends FieldValues>({
    control,
    name,
    emptyValue = null,
    ...ui
}: RHFSelectNumberProps<T>) {
    const { label, description, required, inputUi } = splitRHFUiProps(ui as any);

    return (
        <FormField
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <FormItem className={ui.className}>
                    {label ? <FormLabel>{label}{required ? " *" : ""}</FormLabel> : null}

                    <FormControl>
                        <SelectField
                            {...(inputUi as any)}
                            className={undefined}
                            label={undefined}
                            description={undefined}
                            error={undefined}
                            required={undefined}
                            options={ui.options}
                            placeholder={ui.placeholder}
                            value={field.value != null ? String(field.value) : ""}
                            onValueChange={(v) => {
                                if (!v) return field.onChange(emptyValue);
                                const n = Number(v);
                                field.onChange(Number.isFinite(n) ? n : emptyValue);
                            }}
                            variant={fieldState.error ? "danger" : (ui.variant ?? "default")}
                        />
                    </FormControl>

                    {description ? <FormDescription>{description}</FormDescription> : null}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

export function FormTextareaInput<T extends FieldValues>({ control, name, ...ui }: RHFBaseProps<T>) {
    const { label, description, required, inputUi } = splitRHFUiProps(ui);

    return (
        <FormField
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <FormItem className={ui.className}>
                    {label ? <FormLabel>{label}{required ? " *" : ""}</FormLabel> : null}
                    <FormControl>
                        <TextareaInput
                            {...(inputUi as any)}
                            className={undefined}
                            label={undefined}
                            description={undefined}
                            error={undefined}
                            required={undefined}
                            value={(field.value ?? "") as any}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            variant={fieldState.error ? "danger" : (ui.variant ?? "default")}
                        />
                    </FormControl>
                    {description ? <FormDescription>{description}</FormDescription> : null}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

