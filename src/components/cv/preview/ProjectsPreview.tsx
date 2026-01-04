// src/components/cv/preview/ProjectsPreview.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectData } from "@/types/cv";

export interface ProjectsPreviewProps {
    data: ProjectData[];
}

export function ProjectsPreview({ data }: ProjectsPreviewProps) {
    if (!data?.length) return null;

    return (
        <div className="space-y-4">
            {data.map((project) => (
                <Card key={project.id}>
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold">
                            {project.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {project.description && (
                            <p className="text-sm text-muted-foreground">
                                {project.description}
                            </p>
                        )}
                        {project.url && (
                            <a
                                href={project.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline text-sm mt-1 block"
                            >
                                Ver proyecto
                            </a>
                        )}
                        {(project.startDate || project.endDate) && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {project.startDate ?? ""} {project.endDate ? `- ${project.endDate}` : ""}
                            </p>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

