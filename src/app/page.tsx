"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronRight, File, FolderOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { commonFilters, useFileSystem } from "use-file-system";

interface FileNode {
  name: string;
  type: "file" | "directory";
  children?: FileNode[];
  path: string;
}

export default function Page() {
  const [fileTree, setFileTree] = useState<FileNode | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { onDirectorySelection, files, isBrowserSupported } = useFileSystem({
    filters: commonFilters,
    onFilesAdded: (newFiles) => {
      console.log("Files added:", newFiles);
      updateFileTree(files);
    },
    onFilesChanged: (changedFiles) => {
      console.log("Files changed:", changedFiles);
      updateFileTree(files);
    },
    onFilesDeleted: (deletedFiles) => {
      console.log("Files deleted:", deletedFiles);
      updateFileTree(files);
    },
  });

  useEffect(() => {
    updateFileTree(files);
  }, [files]);

  const updateFileTree = (files: Map<string, File>) => {
    setIsLoading(true);
    const root: FileNode = {
      name: "Root",
      type: "directory",
      children: [],
      path: "",
    };
    files.forEach((file, path) => {
      const parts = path.split("/");
      let current = root;
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          current.children?.push({ name: part, type: "file", path });
        } else {
          let child = current.children?.find((c) => c.name === part);
          if (!child) {
            child = {
              name: part,
              type: "directory",
              children: [],
              path: parts.slice(0, index + 1).join("/"),
            };
            current.children?.push(child);
          }
          current = child;
        }
      });
    });
    setFileTree(root.children?.[0] || null);
    setIsLoading(false);
  };

  const handleFileSelect = (path: string) => {
    const file = files.get(path);
    if (file) {
      setSelectedFile(file);
    }
  };

  const renderFileTree = (node: FileNode) => {
    return (
      <div key={node.path} className="pl-4">
        {node.type === "directory" ? (
          <div>
            <Button
              variant="ghost"
              className="p-1 h-8 w-full justify-start"
              onClick={() => handleFileSelect(node.path)}
            >
              {node.children && node.children.length > 0 ? (
                <ChevronDown className="h-4 w-4 mr-1" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-1" />
              )}
              <FolderOpen className="h-4 w-4 mr-2" />
              {node.name}
            </Button>
            {node.children &&
              node.children.map((child) => renderFileTree(child))}
          </div>
        ) : (
          <Button
            variant="ghost"
            className="p-1 h-8 w-full justify-start"
            onClick={() => handleFileSelect(node.path)}
          >
            <File className="h-4 w-4 mr-2" />
            {node.name}
          </Button>
        )}
      </div>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + " MB";
    else return (bytes / 1073741824).toFixed(2) + " GB";
  };

  const formatDate = (date: number | Date) => {
    const dateObject = typeof date === "number" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(dateObject);
  };

  if (!isBrowserSupported) {
    return (
      <div className="p-4 text-red-500">
        Your browser does not support the File System Access API. Please try
        again in a different browser, such as Chrome.
      </div>
    );
  }

  return (
    <div className="flex h-screen p-4">
      <div className="w-1/3 border-r pr-4">
        <Button onClick={onDirectorySelection} className="w-full mb-4">
          Import Folder
        </Button>
        <ScrollArea className="h-[calc(100vh-120px)]">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[220px]" />
            </div>
          ) : fileTree ? (
            renderFileTree(fileTree)
          ) : (
            <div className="text-center text-gray-500">
              Import a folder to view its contents
            </div>
          )}
        </ScrollArea>
      </div>
      <div className="w-2/3 pl-4">
        <Card>
          <CardHeader>
            <CardTitle>File Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedFile ? (
              <div className="space-y-2">
                <p>
                  <strong>Name:</strong> {selectedFile.name}
                </p>
                <p>
                  <strong>Size:</strong> {formatFileSize(selectedFile.size)}
                </p>
                <p>
                  <strong>Type:</strong> {selectedFile.type || "Unknown"}
                </p>
                <p>
                  <strong>Last Modified:</strong>{" "}
                  {formatDate(selectedFile.lastModified)}
                </p>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                Select a file to view its metadata
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
