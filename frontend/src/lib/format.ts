type NumericValue =
    | number
    | string
    | null
    | undefined;

export function toNumber(
    value: NumericValue,
): number {
    const numberValue = Number(value);

    return Number.isFinite(numberValue)
        ? numberValue
        : 0;
}

export function formatCurrency(
    value: NumericValue,
): string {
    return new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: "CNY",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(toNumber(value));
}

export function formatRatio(
    value: NumericValue,
): string {
    const percentage = toNumber(value) * 100;

    return `${percentage.toFixed(
        Number.isInteger(percentage) ? 0 : 1,
    )}%`;
}

export function formatPercentage(
    value: NumericValue,
): string {
    const percentage = toNumber(value);

    return `${percentage.toFixed(
        Number.isInteger(percentage) ? 0 : 1,
    )}%`;
}

export function formatScore(
    value: NumericValue,
): string {
    if (value === null || value === undefined) {
        return "--";
    }

    return `${toNumber(value).toFixed(1)}分`;
}

export function formatMonth(
    value: string,
): string {
    const [year, month] = value
        .split("-")
        .map(Number);

    if (!year || !month) {
        return value;
    }

    return `${year}年${month}月`;
}

export function formatShortMonth(
    value: string,
): string {
    const month = Number(value.split("-")[1]);

    return month ? `${month}月` : value;
}

export function formatCompactAmount(
    value: NumericValue,
): string {
    const amount = toNumber(value);

    if (Math.abs(amount) >= 10000) {
        const result = amount / 10000;

        return `${result.toFixed(
            Number.isInteger(result) ? 0 : 1,
        )}万`;
    }

    return amount.toLocaleString("zh-CN", {
        maximumFractionDigits: 0,
    });
}

export function formatDateTime(
    value: string,
): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(date);
}

export function toDateTimeLocalValue(
    value?: string | null,
): string {
    const date = value
        ? new Date(value)
        : new Date();

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const timezoneOffset =
        date.getTimezoneOffset() * 60_000;

    return new Date(
        date.getTime() - timezoneOffset,
    )
        .toISOString()
        .slice(0, 16);
}