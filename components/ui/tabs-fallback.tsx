import * as React from "react";

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({
  className,
  defaultValue,
  value,
  onValueChange,
  ...props
}: TabsProps) {
  return <div className={className} {...props} />;
}

export interface TabsListProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function TabsList({ className, ...props }: TabsListProps) {
  return <div className={className} {...props} />;
}

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({
  className,
  value,
  ...props
}: TabsTriggerProps) {
  return <button className={className} {...props} />;
}

export interface TabsContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({
  className,
  value,
  ...props
}: TabsContentProps) {
  return <div className={className} {...props} />;
} 