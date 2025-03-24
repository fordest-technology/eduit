import { getResults } from "./get-results"
import ResultsTable from "./results-table"
import ResultGenerator from "./components/result-generator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function ResultsPage() {
  const results = await getResults()

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Results Management</h1>

      <Tabs defaultValue="results" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="create">Create New Result</TabsTrigger>
        </TabsList>

        <TabsContent value="results">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">All Results</h2>
            <ResultsTable results={results} />
          </div>
        </TabsContent>

        <TabsContent value="create">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Create New Result</h2>
            <ResultGenerator />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

