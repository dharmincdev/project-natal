import { Metadata } from 'next';
import Link from 'next/link';
import { getTreeDataBySlug } from '@/lib/store';
import { redactTreeForPublic } from '@/lib/privacy';
import SharedTreeClient from './SharedTreeClient';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const treeData = await getTreeDataBySlug(slug);

  return {
    title: `${treeData?.tree.name || 'Family Tree'} | Project Natal`,
    description: `View the ${treeData?.tree.name || 'Family'} tree on Project Natal`,
    openGraph: {
      title: `${treeData?.tree.name || 'Family Tree'} | Project Natal`,
      description: `View the ${treeData?.tree.name || 'Family'} tree on Project Natal`,
    },
  };
}

export default async function SharedTreePage({ params }: PageProps) {
  const { slug } = await params;
  const treeData = await getTreeDataBySlug(slug);

  if (!treeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center p-8 max-w-md rounded-2xl border border-border bg-card shadow-sm">
          <h1 className="text-2xl font-bold mb-4">Tree not found</h1>
          <p className="text-muted-foreground mb-6">
            The family tree you are looking for does not exist or has been removed.
          </p>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-primary-foreground bg-primary hover:opacity-90 transition-opacity"
          >
            Explore Demo
          </Link>
        </div>
      </div>
    );
  }

  // SPEC.md §6.1: Redact living individuals on public unauthenticated views
  const publicTreeData = redactTreeForPublic(treeData);

  return <SharedTreeClient initialTreeData={publicTreeData} />;
}
