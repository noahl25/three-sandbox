export default async function Page({ params }: { params: Promise<{ slug: string }>}) {

    const { slug } = await params;
    return (
        <div className="text-white bg-red-500">
            {slug}
        </div>
    );

}