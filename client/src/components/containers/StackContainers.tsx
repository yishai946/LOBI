import { Stack, StackProps } from "@mui/material";
import { ReactNode } from "react";

type ContainerProps = StackProps & {
  children?: ReactNode;
};

export const Row = ({ children, ...props }: ContainerProps) => (
  <Stack direction="row" {...props}>
    {children}
  </Stack>
);

export const Column = ({ children, ...props }: ContainerProps) => (
  <Stack direction="column" {...props}>
    {children}
  </Stack>
);

export const Center = ({ children, ...props }: ContainerProps) => (
  <Stack alignItems="center" justifyContent="center" {...props}>
    {children}
  </Stack>
);
