"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ApiEndpoint {
    name: string;
    description: string;
    endpoints: {
        path: string;
        method: string;
        description: string;
        parameters?: {
            name: string;
            type: string;
            required: boolean;
            description: string;
        }[];
        response?: {
            type: string;
            example: any;
        };
        errorResponses?: {
            status: number;
            description: string;
            example: any;
        }[];
    }[];
}

const apiEndpoints: ApiEndpoint[] = [
    {
        name: "Authentication",
        description: "Endpoints for user authentication and authorization",
        endpoints: [
            {
                path: "/api/auth/login",
                method: "POST",
                description: "Authenticate a user and return a session token",
                parameters: [
                    {
                        name: "email",
                        type: "string",
                        required: true,
                        description: "User's email address"
                    },
                    {
                        name: "password",
                        type: "string",
                        required: true,
                        description: "User's password"
                    }
                ],
                response: {
                    type: "object",
                    example: {
                        user: {
                            id: "123",
                            email: "user@example.com",
                            name: "John Doe",
                            role: "ADMIN"
                        }
                    }
                },
                errorResponses: [
                    {
                        status: 400,
                        description: "Missing email or password",
                        example: { message: "Missing email or password" }
                    },
                    {
                        status: 401,
                        description: "Invalid credentials",
                        example: { message: "Invalid credentials" }
                    },
                    {
                        status: 500,
                        description: "Internal server error",
                        example: { message: "Internal server error" }
                    }
                ]
            },
            {
                path: "/api/auth/logout",
                method: "POST",
                description: "Logout the current user and clear their session",
                response: {
                    type: "object",
                    example: { success: true }
                },
                errorResponses: [
                    {
                        status: 500,
                        description: "Internal server error",
                        example: { error: "Internal server error" }
                    }
                ]
            },
            {
                path: "/api/auth/reset-password",
                method: "POST",
                description: "Reset user's password and send new credentials via email",
                parameters: [
                    {
                        name: "email",
                        type: "string",
                        required: true,
                        description: "User's email address"
                    }
                ],
                response: {
                    type: "object",
                    example: {
                        success: true,
                        message: "If your email is registered, you will receive password reset instructions shortly."
                    }
                },
                errorResponses: [
                    {
                        status: 400,
                        description: "Email is required",
                        example: { error: "Email is required" }
                    },
                    {
                        status: 500,
                        description: "Internal server error",
                        example: { error: "An unexpected error occurred. Please try again later." }
                    }
                ]
            },
            {
                path: "/api/auth/session",
                method: "GET",
                description: "Get the current user's session information",
                response: {
                    type: "object",
                    example: {
                        id: "123",
                        name: "John Doe",
                        email: "user@example.com",
                        role: "ADMIN",
                        schoolId: "456",
                        profileImage: "https://example.com/profile.jpg"
                    }
                },
                errorResponses: [
                    {
                        status: 401,
                        description: "Not authenticated",
                        example: null
                    }
                ]
            }
        ]
    },
    {
        name: "Schools",
        description: "Endpoints for managing school information and registration",
        endpoints: [
            {
                path: "/api/schools",
                method: "GET",
                description: "Get all schools (super_admin) or current school (school_admin)",
                response: {
                    type: "array",
                    example: [
                        {
                            id: "123",
                            name: "Example School",
                            address: "123 School St",
                            phone: "+1234567890",
                            email: "school@example.com",
                            logo: "https://example.com/logo.png",
                            createdAt: "2024-03-25T12:00:00Z",
                            _count: {
                                users: 50,
                                classes: 10
                            }
                        }
                    ]
                },
                errorResponses: [
                    {
                        status: 401,
                        description: "Unauthorized",
                        example: { error: "Unauthorized" }
                    },
                    {
                        status: 500,
                        description: "Failed to fetch schools",
                        example: { error: "Failed to fetch schools" }
                    }
                ]
            },
            {
                path: "/api/schools",
                method: "POST",
                description: "Create a new school (super_admin only)",
                parameters: [
                    {
                        name: "name",
                        type: "string",
                        required: true,
                        description: "School name"
                    },
                    {
                        name: "email",
                        type: "string",
                        required: true,
                        description: "School email"
                    },
                    {
                        name: "address",
                        type: "string",
                        required: false,
                        description: "School address"
                    },
                    {
                        name: "phone",
                        type: "string",
                        required: false,
                        description: "School phone number"
                    },
                    {
                        name: "logo",
                        type: "string",
                        required: false,
                        description: "School logo URL"
                    }
                ],
                response: {
                    type: "object",
                    example: {
                        id: "123",
                        name: "Example School",
                        address: "123 School St",
                        phone: "+1234567890",
                        email: "school@example.com",
                        logo: "https://example.com/logo.png",
                        createdAt: "2024-03-25T12:00:00Z"
                    }
                },
                errorResponses: [
                    {
                        status: 401,
                        description: "Unauthorized",
                        example: { error: "Unauthorized" }
                    },
                    {
                        status: 400,
                        description: "Missing required fields",
                        example: { error: "Name and email are required" }
                    },
                    {
                        status: 400,
                        description: "Email already in use",
                        example: { error: "Email already in use" }
                    },
                    {
                        status: 500,
                        description: "Failed to create school",
                        example: { error: "Failed to create school" }
                    }
                ]
            },
            {
                path: "/api/schools/register",
                method: "POST",
                description: "Register a new school with admin account",
                parameters: [
                    {
                        name: "schoolName",
                        type: "string",
                        required: true,
                        description: "School name"
                    },
                    {
                        name: "shortName",
                        type: "string",
                        required: true,
                        description: "Short name for subdomain"
                    },
                    {
                        name: "email",
                        type: "string",
                        required: true,
                        description: "School email"
                    },
                    {
                        name: "adminName",
                        type: "string",
                        required: true,
                        description: "Admin name"
                    },
                    {
                        name: "adminEmail",
                        type: "string",
                        required: true,
                        description: "Admin email"
                    },
                    {
                        name: "adminPassword",
                        type: "string",
                        required: true,
                        description: "Admin password"
                    },
                    {
                        name: "address",
                        type: "string",
                        required: false,
                        description: "School address"
                    },
                    {
                        name: "phone",
                        type: "string",
                        required: false,
                        description: "School phone number"
                    },
                    {
                        name: "primaryColor",
                        type: "string",
                        required: false,
                        description: "School primary color (hex)"
                    },
                    {
                        name: "secondaryColor",
                        type: "string",
                        required: false,
                        description: "School secondary color (hex)"
                    },
                    {
                        name: "logo",
                        type: "file",
                        required: false,
                        description: "School logo file"
                    }
                ],
                response: {
                    type: "object",
                    example: {
                        success: true,
                        school: {
                            id: "123",
                            name: "Example School",
                            email: "school@example.com",
                            subdomain: "example"
                        },
                        admin: {
                            id: "456",
                            name: "John Doe",
                            email: "admin@example.com"
                        },
                        schoolUrl: "https://example.eduit.com"
                    }
                },
                errorResponses: [
                    {
                        status: 400,
                        description: "Missing required fields",
                        example: { error: "Missing required fields" }
                    },
                    {
                        status: 400,
                        description: "School email already in use",
                        example: { error: "School email already in use" }
                    },
                    {
                        status: 400,
                        description: "School short name already in use",
                        example: { error: "School short name already in use" }
                    },
                    {
                        status: 400,
                        description: "Admin email already in use",
                        example: { error: "Admin email already in use" }
                    },
                    {
                        status: 500,
                        description: "Failed to create school and admin",
                        example: { error: "Failed to create school and admin" }
                    }
                ]
            },
            {
                path: "/api/schools/branding/[subdomain]",
                method: "GET",
                description: "Get school branding information by subdomain",
                parameters: [
                    {
                        name: "subdomain",
                        type: "string",
                        required: true,
                        description: "School subdomain"
                    }
                ],
                response: {
                    type: "object",
                    example: {
                        name: "Example School",
                        subdomain: "example",
                        shortName: "EXS",
                        logo: "https://example.com/logo.png",
                        primaryColor: "#22c55e",
                        secondaryColor: "#f59e0b"
                    }
                },
                errorResponses: [
                    {
                        status: 400,
                        description: "Subdomain is required",
                        example: { error: "Subdomain is required" }
                    },
                    {
                        status: 404,
                        description: "School not found",
                        example: { error: "School not found" }
                    },
                    {
                        status: 500,
                        description: "Internal server error",
                        example: { error: "Internal server error" }
                    }
                ]
            }
        ]
    },
    {
        name: "Users",
        description: "Endpoints for managing user accounts and profiles",
        endpoints: [
            {
                path: "/api/users",
                method: "GET",
                description: "Get all users (super_admin) or school users (school_admin)",
                parameters: [
                    {
                        name: "role",
                        type: "string",
                        required: false,
                        description: "Filter users by role"
                    },
                    {
                        name: "schoolId",
                        type: "string",
                        required: false,
                        description: "Filter users by school ID (super_admin only)"
                    }
                ],
                response: {
                    type: "array",
                    example: [
                        {
                            id: "123",
                            name: "John Doe",
                            email: "john@example.com",
                            role: "TEACHER",
                            schoolId: "456",
                            profileImage: "https://example.com/profile.jpg",
                            createdAt: "2024-03-25T12:00:00Z",
                            teacher: {
                                phone: "+1234567890",
                                gender: "MALE",
                                dateOfBirth: "1990-01-01",
                                address: "123 Teacher St",
                                country: "USA",
                                city: "New York",
                                state: "NY",
                                qualifications: "M.Ed",
                                specialization: "Mathematics",
                                employeeId: "T123",
                                departmentId: "D456",
                                department: {
                                    name: "Mathematics"
                                }
                            },
                            school: {
                                name: "Example School"
                            }
                        }
                    ]
                },
                errorResponses: [
                    {
                        status: 401,
                        description: "Unauthorized",
                        example: { error: "Unauthorized" }
                    },
                    {
                        status: 500,
                        description: "Failed to fetch users",
                        example: { error: "Failed to fetch users" }
                    }
                ]
            },
            {
                path: "/api/users",
                method: "POST",
                description: "Create a new user with role-specific data",
                parameters: [
                    {
                        name: "name",
                        type: "string",
                        required: true,
                        description: "User's full name"
                    },
                    {
                        name: "email",
                        type: "string",
                        required: true,
                        description: "User's email address"
                    },
                    {
                        name: "password",
                        type: "string",
                        required: true,
                        description: "User's password"
                    },
                    {
                        name: "role",
                        type: "string",
                        required: true,
                        description: "User's role (TEACHER, STUDENT, PARENT, SCHOOL_ADMIN, SUPER_ADMIN)"
                    },
                    {
                        name: "profileImage",
                        type: "file",
                        required: false,
                        description: "User's profile image"
                    },
                    {
                        name: "teacherData",
                        type: "object",
                        required: false,
                        description: "Teacher-specific data (required for TEACHER role)"
                    },
                    {
                        name: "studentData",
                        type: "object",
                        required: false,
                        description: "Student-specific data (required for STUDENT role)"
                    },
                    {
                        name: "parentData",
                        type: "object",
                        required: false,
                        description: "Parent-specific data (required for PARENT role)"
                    },
                    {
                        name: "adminData",
                        type: "object",
                        required: false,
                        description: "Admin-specific data (required for SCHOOL_ADMIN or SUPER_ADMIN role)"
                    }
                ],
                response: {
                    type: "object",
                    example: {
                        id: "123",
                        name: "John Doe",
                        email: "john@example.com",
                        role: "TEACHER",
                        schoolId: "456",
                        profileImage: "https://example.com/profile.jpg",
                        teacher: {
                            phone: "+1234567890",
                            gender: "MALE",
                            dateOfBirth: "1990-01-01",
                            address: "123 Teacher St",
                            country: "USA",
                            city: "New York",
                            state: "NY",
                            qualifications: "M.Ed",
                            specialization: "Mathematics",
                            employeeId: "T123",
                            departmentId: "D456"
                        }
                    }
                },
                errorResponses: [
                    {
                        status: 401,
                        description: "Unauthorized",
                        example: { error: "Unauthorized" }
                    },
                    {
                        status: 400,
                        description: "Missing required fields",
                        example: { error: "Missing required fields" }
                    },
                    {
                        status: 400,
                        description: "Email already in use",
                        example: { error: "Email already in use" }
                    },
                    {
                        status: 400,
                        description: "School ID is required for this user role",
                        example: { error: "School ID is required for this user role" }
                    },
                    {
                        status: 400,
                        description: "School not found",
                        example: { error: "School not found" }
                    },
                    {
                        status: 500,
                        description: "Failed to create user",
                        example: { error: "Failed to create user" }
                    }
                ]
            },
            {
                path: "/api/users/[id]",
                method: "GET",
                description: "Get a specific user's details",
                parameters: [
                    {
                        name: "id",
                        type: "string",
                        required: true,
                        description: "User ID"
                    }
                ],
                response: {
                    type: "object",
                    example: {
                        id: "123",
                        name: "John Doe",
                        email: "john@example.com",
                        role: "TEACHER",
                        schoolId: "456",
                        createdAt: "2024-03-25T12:00:00Z",
                        school: {
                            name: "Example School"
                        },
                        teacherClasses: [
                            {
                                id: "789",
                                name: "Class 10A"
                            }
                        ],
                        teacherSubjects: [
                            {
                                id: "101",
                                subject: {
                                    id: "102",
                                    name: "Mathematics"
                                }
                            }
                        ]
                    }
                },
                errorResponses: [
                    {
                        status: 401,
                        description: "Unauthorized",
                        example: { error: "Unauthorized" }
                    },
                    {
                        status: 403,
                        description: "Forbidden",
                        example: { error: "Forbidden" }
                    },
                    {
                        status: 404,
                        description: "User not found",
                        example: { error: "User not found" }
                    },
                    {
                        status: 500,
                        description: "Failed to fetch user",
                        example: { error: "Failed to fetch user" }
                    }
                ]
            },
            {
                path: "/api/users/[id]",
                method: "PUT",
                description: "Update a user's details",
                parameters: [
                    {
                        name: "id",
                        type: "string",
                        required: true,
                        description: "User ID"
                    },
                    {
                        name: "name",
                        type: "string",
                        required: false,
                        description: "User's full name"
                    },
                    {
                        name: "email",
                        type: "string",
                        required: false,
                        description: "User's email address"
                    },
                    {
                        name: "password",
                        type: "string",
                        required: false,
                        description: "User's new password"
                    },
                    {
                        name: "role",
                        type: "string",
                        required: false,
                        description: "User's new role (super_admin only)"
                    },
                    {
                        name: "schoolId",
                        type: "string",
                        required: false,
                        description: "User's new school ID (super_admin only)"
                    }
                ],
                response: {
                    type: "object",
                    example: {
                        id: "123",
                        name: "John Doe",
                        email: "john@example.com",
                        role: "TEACHER",
                        schoolId: "456",
                        updatedAt: "2024-03-25T12:00:00Z"
                    }
                },
                errorResponses: [
                    {
                        status: 401,
                        description: "Unauthorized",
                        example: { error: "Unauthorized" }
                    },
                    {
                        status: 403,
                        description: "Forbidden",
                        example: { error: "Forbidden" }
                    },
                    {
                        status: 500,
                        description: "Failed to update user",
                        example: { error: "Failed to update user" }
                    }
                ]
            },
            {
                path: "/api/users/[id]",
                method: "DELETE",
                description: "Delete a user (super_admin or school_admin only)",
                parameters: [
                    {
                        name: "id",
                        type: "string",
                        required: true,
                        description: "User ID"
                    }
                ],
                response: {
                    type: "object",
                    example: { success: true }
                },
                errorResponses: [
                    {
                        status: 401,
                        description: "Unauthorized",
                        example: { error: "Unauthorized" }
                    },
                    {
                        status: 403,
                        description: "Forbidden",
                        example: { error: "Forbidden" }
                    },
                    {
                        status: 500,
                        description: "Failed to delete user",
                        example: { error: "Failed to delete user" }
                    }
                ]
            }
        ]
    }
];

export default function ApiDocs() {
    const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(apiEndpoints[0]);

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-4xl font-bold mb-8">API Documentation</h1>

            <Tabs defaultValue={apiEndpoints[0].name} className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                    {apiEndpoints.map((endpoint) => (
                        <TabsTrigger
                            key={endpoint.name}
                            value={endpoint.name}
                            onClick={() => setSelectedEndpoint(endpoint)}
                        >
                            {endpoint.name}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {apiEndpoints.map((endpoint) => (
                    <TabsContent key={endpoint.name} value={endpoint.name}>
                        <Card>
                            <CardHeader>
                                <CardTitle>{endpoint.name}</CardTitle>
                                <CardDescription>{endpoint.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[600px] w-full rounded-md border p-4">
                                    {endpoint.endpoints.map((api) => (
                                        <div key={api.path} className="mb-8">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant={api.method === "GET" ? "default" : "secondary"}>
                                                    {api.method}
                                                </Badge>
                                                <code className="bg-muted px-2 py-1 rounded">{api.path}</code>
                                            </div>
                                            <p className="text-muted-foreground mb-4">{api.description}</p>

                                            {api.parameters && (
                                                <div className="mb-4">
                                                    <h3 className="font-semibold mb-2">Parameters</h3>
                                                    <div className="space-y-2">
                                                        {api.parameters.map((param) => (
                                                            <div key={param.name} className="flex gap-4">
                                                                <code className="bg-muted px-2 py-1 rounded">{param.name}</code>
                                                                <span className="text-muted-foreground">{param.description}</span>
                                                                <Badge variant="outline">{param.type}</Badge>
                                                                {param.required && (
                                                                    <Badge variant="destructive">Required</Badge>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {api.response && (
                                                <div className="mb-4">
                                                    <h3 className="font-semibold mb-2">Response</h3>
                                                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                                                        {JSON.stringify(api.response.example, null, 2)}
                                                    </pre>
                                                </div>
                                            )}

                                            {api.errorResponses && (
                                                <div className="mb-4">
                                                    <h3 className="font-semibold mb-2">Error Responses</h3>
                                                    <div className="space-y-2">
                                                        {api.errorResponses.map((error) => (
                                                            <div key={error.status} className="flex gap-4 items-start">
                                                                <Badge variant="destructive">{error.status}</Badge>
                                                                <div>
                                                                    <p className="text-muted-foreground">{error.description}</p>
                                                                    <pre className="bg-muted p-2 rounded-lg mt-1 text-sm">
                                                                        {JSON.stringify(error.example, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <Button variant="outline" size="sm">
                                                Try it out
                                            </Button>
                                        </div>
                                    ))}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
} 