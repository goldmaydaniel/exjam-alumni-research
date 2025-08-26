"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Upload,
  Download,
  Trash2,
  Eye,
  Search,
  RefreshCw,
  MoreHorizontal,
  FolderOpen,
  FileImage,
  FileText,
  Image as ImageIcon,
  HardDrive,
  Database,
  Activity,
} from "lucide-react";
import { StorageManager, StorageStats, StorageFile } from "@/lib/storage-management";
import { STORAGE_BUCKETS } from "@/lib/supabase/storage";
import { toast } from "sonner";

interface StorageAdminProps {
  className?: string;
}

export default function StorageAdmin({ className }: StorageAdminProps) {
  const [stats, setStats] = useState<StorageStats[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<keyof typeof STORAGE_BUCKETS>("ASSETS");
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadStorageStats();
    loadFiles();
  }, [selectedBucket, currentFolder]);

  const loadStorageStats = async () => {
    try {
      const storageStats = await StorageManager.getStorageStats();
      setStats(storageStats);
    } catch (error) {
      toast.error("Failed to load storage statistics");
    }
  };

  const loadFiles = async () => {
    setLoading(true);
    try {
      const { files: fileList, error } = await StorageManager.getFileList(
        selectedBucket,
        currentFolder,
        { search: searchTerm, limit: 100 }
      );

      if (error) {
        toast.error(error);
      } else {
        setFiles(fileList);
      }
    } catch (error) {
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (uploadedFiles: FileList) => {
    if (!uploadedFiles.length) return;

    setUploadProgress(0);
    const totalFiles = uploadedFiles.length;
    let completed = 0;

    try {
      for (const file of Array.from(uploadedFiles)) {
        const result = await StorageManager.uploadFile(file, {
          bucket: selectedBucket,
          folder: currentFolder || "general",
          compress: true,
          generateThumbnail: file.type.startsWith("image/"),
        });

        if (result.error) {
          toast.error(`Failed to upload ${file.name}: ${result.error}`);
        } else {
          toast.success(`Uploaded ${file.name}`);
        }

        completed++;
        setUploadProgress((completed / totalFiles) * 100);
      }

      loadFiles();
      loadStorageStats();
      setShowUploadDialog(false);
    } catch (error) {
      toast.error("Upload failed");
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedFiles.length) return;

    try {
      const result = await StorageManager.bulkDeleteFiles(selectedBucket, selectedFiles);

      if (result.success) {
        toast.success(`Deleted ${result.deletedCount} files`);
        setSelectedFiles([]);
        loadFiles();
        loadStorageStats();
      } else {
        toast.error(`Delete failed: ${result.errors.join(", ")}`);
      }
    } catch (error) {
      toast.error("Bulk delete failed");
    }
  };

  const handleCleanupOrphaned = async () => {
    try {
      const result = await StorageManager.cleanupOrphanedFiles();

      if (result.errors.length === 0) {
        toast.success(`Cleaned up ${result.deletedCount} orphaned files`);
        loadFiles();
        loadStorageStats();
      } else {
        toast.error(`Cleanup failed: ${result.errors.join(", ")}`);
      }
    } catch (error) {
      toast.error("Cleanup failed");
    }
  };

  const getFileIcon = (fileName: string, mimeType?: string) => {
    if (mimeType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTotalStorageUsed = () => {
    return stats.reduce((total, stat) => total + stat.totalSize, 0);
  };

  const getTotalFiles = () => {
    return stats.reduce((total, stat) => total + stat.fileCount, 0);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Storage Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Storage</p>
                <p className="text-2xl font-bold">
                  {StorageManager.formatFileSize(getTotalStorageUsed())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Files</p>
                <p className="text-2xl font-bold">{getTotalFiles().toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Buckets</p>
                <p className="text-2xl font-bold">{stats.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg File Size</p>
                <p className="text-2xl font-bold">
                  {StorageManager.formatFileSize(
                    getTotalFiles() > 0 ? getTotalStorageUsed() / getTotalFiles() : 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bucket Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Buckets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.map((stat) => (
              <div
                key={stat.bucket}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center space-x-4">
                  <div>
                    <h4 className="font-semibold">{stat.bucket}</h4>
                    <p className="text-sm text-muted-foreground">
                      {stat.fileCount} files • Last upload: {formatDate(stat.lastUpload)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{stat.totalSizeFormatted}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedBucket(stat.bucket as keyof typeof STORAGE_BUCKETS)}
                  >
                    Browse
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* File Browser */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>File Browser - {selectedBucket}</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleCleanupOrphaned}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Cleanup
              </Button>

              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Files to {selectedBucket}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      type="file"
                      multiple
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    />
                    {uploadProgress > 0 && <Progress value={uploadProgress} className="w-full" />}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Controls */}
            <div className="flex items-center justify-between">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{selectedFiles.length} selected</Badge>
                  <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected
                  </Button>
                </div>
              )}
            </div>

            {/* Files Table */}
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedFiles.length === files.length && files.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFiles(files.map((f) => f.name));
                          } else {
                            setSelectedFiles([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Modified</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-4 text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : files.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-4 text-center">
                        No files found
                      </TableCell>
                    </TableRow>
                  ) : (
                    files.map((file) => (
                      <TableRow key={file.name}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedFiles.includes(file.name)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFiles([...selectedFiles, file.name]);
                              } else {
                                setSelectedFiles(selectedFiles.filter((f) => f !== file.name));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getFileIcon(file.name, file.metadata?.mimetype)}
                            <span className="font-medium">{file.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {file.metadata?.size
                            ? StorageManager.formatFileSize(file.metadata.size)
                            : "-"}
                        </TableCell>
                        <TableCell>{file.updated_at ? formatDate(file.updated_at) : "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{file.metadata?.mimetype || "Unknown"}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
