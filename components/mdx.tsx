import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { Callout } from "fumadocs-ui/components/callout";
import { Card } from "fumadocs-ui/components/card";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { ArrowRight } from "lucide-react";
import type { MDXComponents } from "mdx/types";
import type { ComponentProps } from "react";
import { ChangeEntry, ChangeScreenshot } from "./changelog";
import { DocsDiagram } from "./docs-diagram";

function DocsCallout(props: ComponentProps<typeof Callout>) {
  return <Callout {...props} data-docs-callout={props.type ?? "info"} />;
}

function DocsCard({ title, href, ...props }: ComponentProps<typeof Card>) {
  return (
    <Card
      {...props}
      href={href}
      title={
        <>
          <span>{title}</span>
          {href && (
            <ArrowRight aria-hidden="true" className="docs-card-arrow" />
          )}
        </>
      }
    />
  );
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Callout: DocsCallout,
    Card: DocsCard,
    Accordion,
    Accordions,
    Step,
    Steps,
    Tab,
    Tabs,
    DocsDiagram,
    ChangeEntry,
    ChangeScreenshot,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
