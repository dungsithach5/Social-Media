import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import axios from "axios"
import { Button } from "../components/ui/button";
import { Ellipsis, Download, Trash2, Flag } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast'
import { useState } from "react";

interface DropdownMenuEllipsisProps {
  imageUrl: string;
  fileName?: string;
  onOpenChange?: (open: boolean) => void;
  isOwner?: boolean;
  onDelete?: (id: number) => void;      
  postId?: number;
}



export default function DropdownMenuEllipsis ({
  imageUrl,
  fileName = "downloaded.jpg",
  onOpenChange,
  isOwner = false,
  onDelete,
  postId,
}: DropdownMenuEllipsisProps) {
  const [openModal, setOpenModal] = useState(false);
  const [openReportModal, setOpenReportModal] = useState(false); // modal report
  const [reportReason, setReportReason] = useState("");

  const handleDownload = async () => {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  };

  const confirmDelete = async () => {
    await onDelete?.(postId!);
    setOpenModal(false);
  };
  
  const handleReportSubmit = async () => {
    if (!reportReason.trim()) {
      toast.error("Please enter a reason");
      return;
    }

    const delayedPromise = new Promise(async (resolve, reject) => {
      try {
        const res = await axios.post("http://localhost:5000/api/reports", {
          post_id: postId,
          reason: reportReason,
        });
        setTimeout(() => resolve(res), 2000);
      } catch (err) {
        setTimeout(() => reject(err), 2000);
      }
    });

    toast.promise(
      delayedPromise,
      {
        loading: "Submitting report...",
        success: "Report submitted successfully!",
        error: "Failed to submit report.",
      }
    ).then(() => {
      setOpenReportModal(false);
      setReportReason("");
    });
  };


  return (
    <>
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Ellipsis 
          size={24} 
          color="white" 
          className="absolute top-3 right-3 cursor-pointer h-6 w-6 hover:bg-black/35 rounded-full" 
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem 
          onClick={handleDownload} 
          className="cursor-pointer"
        >
          <Download size={18} color="black"/>
          Download
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setOpenReportModal(true)}
          className="cursor-pointer"
        >
          <Flag size={18} color="black"/>
          Report
        </DropdownMenuItem>
          {isOwner && (
            <DropdownMenuItem
              onClick={() => setOpenModal(true)}
              className="cursor-pointer text-black"
            >
              <Trash2 size={18} color="black" />
              Delete post
            </DropdownMenuItem>
          )}
      </DropdownMenuContent>
    </DropdownMenu>
    {/* Modal Confirm Delete */}
    <Dialog open={openModal} onOpenChange={setOpenModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>
        <p>Are you sure you want to delete this post?</p>
        <DialogFooter className="mt-4 flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setOpenModal(false)}>
            Cancel
          </Button>
          <Button variant="destructive" className="cursor-pointer" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Modal Report with input */}
      <Dialog open={openReportModal} onOpenChange={setOpenReportModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Post</DialogTitle>
          </DialogHeader>
          <textarea
            placeholder="Enter reason for report"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="w-full border rounded p-2 min-h-[100px] resize-none"
          />
          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpenReportModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReportSubmit}
              disabled={!reportReason.trim()}
            >
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
