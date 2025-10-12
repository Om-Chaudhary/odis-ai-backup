"use client";

import type React from "react";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { CheckCircle2 } from "lucide-react";

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    practiceName: "",
    role: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    console.log("Form submitted:", formData);
    setIsSubmitted(true);
  };

  const handleClose = () => {
    setIsSubmitted(false);
    setFormData({ name: "", email: "", practiceName: "", role: "" });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {!isSubmitted ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl font-bold text-[#1a202c]">
                Join the Waitlist
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="your@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="practiceName">Practice Name</Label>
                <Input
                  id="practiceName"
                  value={formData.practiceName}
                  onChange={(e) =>
                    setFormData({ ...formData, practiceName: e.target.value })
                  }
                  placeholder="Your practice name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="veterinarian">Veterinarian</SelectItem>
                    <SelectItem value="practice-manager">
                      Practice Manager
                    </SelectItem>
                    <SelectItem value="technician">Technician</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#31aba3] text-white hover:bg-[#2a9a92]"
              >
                Get Early Access
              </Button>
            </form>
          </>
        ) : (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-[#31aba3]" />
            <h3 className="font-display mb-2 text-2xl font-bold text-[#1a202c]">
              Thank you!
            </h3>
            <p className="font-serif text-[#4a5568]">
              We'll be in touch soon with early access.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
