import { Metadata } from 'next';
import Link from 'next/link';
import { getTreeDataBySlug } from '@/lib/store';
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold mb-4">Tree not found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The family tree you are looking for does not exist or has been removed.
          </p>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Explore Demo
          </Link>
        </div>
      </div>
    );
  }

  return <SharedTreeClient initialTreeData={treeData} />;
}
