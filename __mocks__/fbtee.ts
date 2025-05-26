import { ReactNode } from "react";

export function fbt(text: string, description: string): string {
	return text;
}

function param<T>(name: string, value: T): string {
	return value as unknown as string;
}

fbt.param = param;

function _(children: ReactNode) {
  return children;
}

fbt._ = _;
