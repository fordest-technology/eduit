import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Database, Key, Server } from "lucide-react"

export default function SetupDocumentationPage() {
  return (
    <div className="container py-10 max-w-5xl">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2">EduIT Setup Documentation</h1>
        <p className="text-xl text-muted-foreground">
          Complete guide to setting up and configuring the EduIT School Management System
        </p>
      </div>

      <Tabs defaultValue="installation">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="installation">Installation</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="environment">Environment</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
        </TabsList>

        <TabsContent value="installation" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Requirements</CardTitle>
              <CardDescription>Make sure your system meets these requirements before installation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc pl-6 space-y-2">
                <li>Node.js 18.x or higher</li>
                <li>npm 8.x or yarn 1.22.x</li>
                <li>PostgreSQL database (Neon PostgreSQL recommended)</li>
                <li>Git (for version control)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Installation Steps</CardTitle>
              <CardDescription>Follow these steps to install EduIT on your local machine</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">1. Clone the Repository</h3>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  <code>git clone https://github.com/yourusername/eduit.git</code>
                </pre>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">2. Install Dependencies</h3>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  <code>cd eduit npm install # or yarn install</code>
                </pre>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">3. Set Up Environment Variables</h3>
                <p>
                  Create a <code>.env.local</code> file in the root directory with the following variables:
                </p>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  <code>
                    DATABASE_URL="postgresql://username:password@hostname:port/database" JWT_SECRET="your-secret-key" #
                    Optional email configuration EMAIL_HOST="smtp.example.com" EMAIL_PORT="587" EMAIL_SECURE="false"
                    EMAIL_USER="user@example.com" EMAIL_PASSWORD="password" EMAIL_FROM="noreply@eduit.com"
                  </code>
                </pre>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">4. Initialize the Database</h3>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  <code>npx prisma db push</code>
                </pre>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">5. Create Super Admin User</h3>
                <p>
                  Create a seed script in <code>prisma/seed.ts</code>:
                </p>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  <code>{`import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Create Super Admin
  const hashedPassword = await hash('password123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
    },
  })

  console.log('Seed data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })`}</code>
                </pre>
                <p>
                  Add this to your <code>package.json</code>:
                </p>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  <code>{`"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}`}</code>
                </pre>
                <p>Then run:</p>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  <code>npx prisma db seed</code>
                </pre>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">6. Start the Development Server</h3>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  <code>npm run dev # or yarn dev</code>
                </pre>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Your EduIT instance should now be running at{" "}
                  <a href="http://localhost:3000" className="underline">
                    http://localhost:3000
                  </a>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Setup</CardTitle>
              <CardDescription>Setting up and configuring your Neon PostgreSQL database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">1. Create a Neon Account</h3>
                <p>
                  Visit{" "}
                  <a
                    href="https://neon.tech"
                    className="text-primary underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    neon.tech
                  </a>{" "}
                  and create an account.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">2. Create a New Project</h3>
                <p>From the Neon dashboard, click "New Project" and follow the setup wizard.</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">3. Get Connection String</h3>
                <p>Once your project is created, go to the "Connection Details" tab and copy the connection string.</p>
                <p>It should look like this:</p>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  <code>postgresql://username:password@hostname:port/database</code>
                </pre>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">4. Add to Environment Variables</h3>
                <p>
                  Add the connection string to your <code>.env.local</code> file:
                </p>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  <code>DATABASE_URL="postgresql://username:password@hostname:port/database"</code>
                </pre>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">5. Initialize the Database Schema</h3>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  <code>npx prisma db push</code>
                </pre>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">6. Explore Your Database (Optional)</h3>
                <p>You can use Prisma Studio to explore and manage your database:</p>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  <code>npx prisma studio</code>
                </pre>
              </div>

              <Alert>
                <Database className="h-4 w-4" />
                <AlertTitle>Database Migrations</AlertTitle>
                <AlertDescription>
                  For production environments, it's recommended to use Prisma Migrate instead of db push:
                  <pre className="bg-muted p-2 rounded-md mt-2 overflow-x-auto">
                    <code>npx prisma migrate dev --name init</code>
                  </pre>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="environment" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Environment Configuration</CardTitle>
              <CardDescription>Setting up environment variables and configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Required Environment Variables</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <code>DATABASE_URL</code> - PostgreSQL connection string
                  </li>
                  <li>
                    <code>JWT_SECRET</code> - Secret key for JWT token signing
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Optional Environment Variables</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <code>EMAIL_HOST</code> - SMTP server hostname
                  </li>
                  <li>
                    <code>EMAIL_PORT</code> - SMTP server port
                  </li>
                  <li>
                    <code>EMAIL_SECURE</code> - Use TLS (true/false)
                  </li>
                  <li>
                    <code>EMAIL_USER</code> - SMTP username
                  </li>
                  <li>
                    <code>EMAIL_PASSWORD</code> - SMTP password
                  </li>
                  <li>
                    <code>EMAIL_FROM</code> - Default sender email address
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Generating a Secure JWT Secret</h3>
                <p>You can generate a secure random string for your JWT_SECRET using Node.js:</p>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  <code>node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"</code>
                </pre>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Environment Files</h3>
                <p>Different environment files for different environments:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <code>.env.local</code> - Local development (not committed to git)
                  </li>
                  <li>
                    <code>.env.development</code> - Development environment
                  </li>
                  <li>
                    <code>.env.test</code> - Testing environment
                  </li>
                  <li>
                    <code>.env.production</code> - Production environment
                  </li>
                </ul>
              </div>

              <Alert>
                <Key className="h-4 w-4" />
                <AlertTitle>Security Note</AlertTitle>
                <AlertDescription>
                  Never commit your environment files containing secrets to version control. Make sure{" "}
                  <code>.env*</code> is in your <code>.gitignore</code> file.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployment" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Guide</CardTitle>
              <CardDescription>Deploying EduIT to production environments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Deploying to Vercel</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Push your code to a GitHub repository</li>
                  <li>
                    Create an account on{" "}
                    <a
                      href="https://vercel.com"
                      className="text-primary underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Vercel
                    </a>
                  </li>
                  <li>Click "Add New" and select "Project"</li>
                  <li>Import your GitHub repository</li>
                  <li>Configure your environment variables in the Vercel dashboard</li>
                  <li>Click "Deploy"</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Custom Domain Setup</h3>
                <p>To set up a custom domain for your EduIT instance:</p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Go to your project settings in Vercel</li>
                  <li>Navigate to the "Domains" tab</li>
                  <li>Add your domain and follow the DNS configuration instructions</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Wildcard Subdomain Configuration</h3>
                <p>For school-specific subdomains (e.g., school1.eduit.com, school2.eduit.com):</p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Add a wildcard domain (*.eduit.com) in your Vercel project</li>
                  <li>Configure a wildcard DNS record (*.eduit.com) pointing to your Vercel deployment</li>
                  <li>Implement subdomain routing in your application</li>
                </ol>
              </div>

              <Alert>
                <Server className="h-4 w-4" />
                <AlertTitle>Production Checklist</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Set up proper database backups</li>
                    <li>Configure monitoring and alerts</li>
                    <li>Set up a CI/CD pipeline</li>
                    <li>Enable HTTPS for all traffic</li>
                    <li>Configure rate limiting for API routes</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="troubleshooting" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Troubleshooting</CardTitle>
              <CardDescription>Common issues and their solutions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Database Connection Issues</h3>
                <p>
                  <strong>Problem:</strong> Unable to connect to the database
                </p>
                <p>
                  <strong>Solutions:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Verify your DATABASE_URL is correct in your .env file</li>
                  <li>Check if your IP is allowed in the database firewall settings</li>
                  <li>Ensure your database server is running</li>
                  <li>Try connecting with a different PostgreSQL client to verify credentials</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Prisma Migration Issues</h3>
                <p>
                  <strong>Problem:</strong> Prisma migration fails
                </p>
                <p>
                  <strong>Solutions:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Reset your database: <code>npx prisma migrate reset</code>
                  </li>
                  <li>Check for conflicts in your schema.prisma file</li>
                  <li>
                    Try using db push instead for development: <code>npx prisma db push</code>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Authentication Issues</h3>
                <p>
                  <strong>Problem:</strong> JWT authentication not working
                </p>
                <p>
                  <strong>Solutions:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Verify your JWT_SECRET is set correctly</li>
                  <li>Check if cookies are being properly set and sent</li>
                  <li>Ensure your JWT token hasn't expired</li>
                  <li>Check for CORS issues if using a separate frontend</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Email Sending Issues</h3>
                <p>
                  <strong>Problem:</strong> Emails not being sent
                </p>
                <p>
                  <strong>Solutions:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Verify your email configuration in environment variables</li>
                  <li>Check if your SMTP server allows the connection</li>
                  <li>Look for authentication errors in the logs</li>
                  <li>Try using a different email service provider</li>
                </ul>
              </div>

              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Common Deployment Errors</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Missing environment variables in production</li>
                    <li>Database connection timeouts due to connection limits</li>
                    <li>Memory issues with large datasets</li>
                    <li>CORS errors when accessing from different domains</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

