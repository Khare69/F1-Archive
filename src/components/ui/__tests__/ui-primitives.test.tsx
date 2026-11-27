import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';
import { Card, CardHeader, CardTitle, CardContent } from '../card';
import { Badge } from '../badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '../dialog';
import { Skeleton } from '../skeleton';

describe('shadcn/ui Radix Primitives', () => {
  it('renders Button with variants and sizes', () => {
    render(
      <div>
        <Button variant="default">Default Button</Button>
        <Button variant="primary">Primary Crimson</Button>
        <Button variant="ghost">Ghost Button</Button>
      </div>
    );

    const defaultBtn = screen.getByText('Default Button');
    expect(defaultBtn).toBeInTheDocument();
    expect(screen.getByText('Primary Crimson')).toBeInTheDocument();
  });

  it('renders Card with header, title, and content', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Telemetry Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Sector 1: 27.012s</p>
        </CardContent>
      </Card>
    );

    expect(screen.getByText('Telemetry Overview')).toBeInTheDocument();
    expect(screen.getByText('Sector 1: 27.012s')).toBeInTheDocument();
  });

  it('renders Badge with telemetry and tyre variants', () => {
    render(
      <div>
        <Badge variant="tyreSoft">S</Badge>
        <Badge variant="tyreMedium">M</Badge>
        <Badge variant="sectorPurple">PURPLE</Badge>
      </div>
    );

    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('PURPLE')).toBeInTheDocument();
  });

  it('switches Tabs on click', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab One</TabsTrigger>
          <TabsTrigger value="tab2">Tab Two</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content One</TabsContent>
        <TabsContent value="tab2">Content Two</TabsContent>
      </Tabs>
    );

    expect(screen.getByText('Content One')).toBeInTheDocument();
    expect(screen.queryByText('Content Two')).toBeNull();

    const tab2 = screen.getByRole('tab', { name: 'Tab Two' });
    await user.click(tab2);

    expect(await screen.findByText('Content Two')).toBeInTheDocument();
  });

  it('opens Dialog when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Dialog Details</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    expect(screen.queryByText('Dialog Title')).toBeNull();

    const trigger = screen.getByText('Open Dialog');
    await user.click(trigger);

    expect(await screen.findByText('Dialog Title')).toBeInTheDocument();
    expect(screen.getByText('Dialog Details')).toBeInTheDocument();
  });

  it('renders Skeleton with pulse styling', () => {
    const { container } = render(<Skeleton className="h-4 w-24" />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });
});
