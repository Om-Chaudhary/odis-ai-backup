"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "~/trpc/client";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  PawPrint,
  User,
  Phone,
  Mail,
  MoreHorizontal,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/ui/card";
import { Input } from "@odis-ai/ui/input";
import { Button } from "@odis-ai/ui/button";
import { Badge } from "@odis-ai/ui/badge";
import { Skeleton } from "@odis-ai/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@odis-ai/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@odis-ai/ui/table";

const SPECIES_ICONS: Record<string, string> = {
  dog: "🐕",
  canine: "🐕",
  cat: "🐈",
  feline: "🐈",
  bird: "🦜",
  rabbit: "🐰",
  horse: "🐴",
  equine: "🐴",
  reptile: "🦎",
  hamster: "🐹",
  guinea_pig: "🐹",
  fish: "🐟",
};

export default function AdminPatientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialUserId = searchParams.get("userId") ?? "";

  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState<string>("");
  const [userIdFilter, setUserIdFilter] = useState(initialUserId);
  const [page, setPage] = useState(1);

  const pageSize = 20;

  const { data, isLoading, error } = api.admin.listPatients.useQuery({
    page,
    pageSize,
    search: search || undefined,
    species: speciesFilter || undefined,
    userId: userIdFilter || undefined,
    sortBy: "created_at",
    sortOrder: "desc",
  });

  const getSpeciesIcon = (species: string | null) => {
    if (!species) return "🐾";
    const lower = species.toLowerCase();
    return SPECIES_ICONS[lower] ?? "🐾";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="mt-1 text-sm text-slate-600">
            View all patients across all users
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 py-4">
          <div className="relative min-w-[250px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search patient, owner, user, or clinic..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select
            value={speciesFilter}
            onValueChange={(value) => {
              setSpeciesFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <PawPrint className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All species" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All species</SelectItem>
              <SelectItem value="dog">Dog</SelectItem>
              <SelectItem value="cat">Cat</SelectItem>
              <SelectItem value="bird">Bird</SelectItem>
              <SelectItem value="rabbit">Rabbit</SelectItem>
              <SelectItem value="horse">Horse</SelectItem>
              <SelectItem value="reptile">Reptile</SelectItem>
            </SelectContent>
          </Select>
          {userIdFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUserIdFilter("");
                setPage(1);
              }}
            >
              Clear user filter
              <XCircle className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Patients
            {data && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({data.pagination.total} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="py-8 text-center text-sm text-rose-600">
              Failed to load patients: {error.message}
            </div>
          ) : isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : data && data.patients.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Species/Breed</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>User/Clinic</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.patients.map((patient) => (
                    <TableRow key={patient.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {getSpeciesIcon(patient.species)}
                          </span>
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">
                              {patient.name ?? "Unknown"}
                            </span>
                            {patient.age && (
                              <span className="text-xs text-slate-500">
                                {patient.age}
                                {patient.weight ? `, ${patient.weight}` : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm capitalize text-slate-900">
                            {patient.species ?? "—"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {patient.breed ?? "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-900">
                            {patient.ownerName ?? "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {patient.ownerPhone && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Phone className="h-3 w-3" />
                              {patient.ownerPhone}
                            </div>
                          )}
                          {patient.ownerEmail && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Mail className="h-3 w-3" />
                              {patient.ownerEmail}
                            </div>
                          )}
                          {!patient.ownerPhone && !patient.ownerEmail && (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-900">
                            {patient.user?.firstName
                              ? `${patient.user.firstName} ${patient.user.lastName ?? ""}`
                              : patient.user?.email ?? "—"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {patient.user?.clinicName ?? "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-500">
                          {new Date(patient.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/admin/accounts/${patient.userId}`,
                                )
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Owner Account
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/admin/cases?userId=${patient.userId}`,
                                )
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Cases
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) =>
                        Math.min(data.pagination.totalPages, p + 1),
                      )
                    }
                    disabled={page >= data.pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-sm text-slate-500">
              No patients found matching your filters
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
