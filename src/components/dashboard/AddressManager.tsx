// src/components/dashboard/AddressManager.tsx
"use client";

import { useState } from "react";
import {
  MapPin,
  Plus,
  Trash2,
  Home,
  Briefcase,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { IAddressSerializable } from "@/types/user";

export function AddressManager({
  initialAddresses,
}: {
  initialAddresses: IAddressSerializable[];
}) {
  const [addresses, setAddresses] =
    useState<IAddressSerializable[]>(initialAddresses);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState<string | null>(null); // 'adding' or addressId

  // Form State for new/edit
  const [formData, setFormData] = useState({
    label: "Home",
    name: "",
    phone: "",
    addressLine1: "",
    city: "",
    district: "",
    postalCode: "",
    isDefault: false,
  });

  const resetForm = () => {
    setFormData({
      label: "Home",
      name: "",
      phone: "",
      addressLine1: "",
      city: "",
      district: "",
      postalCode: "",
      isDefault: false,
    });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("adding");
    try {
      const res = await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setAddresses(data.addresses);
        setShowAddForm(false);
        resetForm();
        toast.success("Address added successfully");
      } else {
        toast.error(data.error || "Failed to add address");
      }
    } catch (err) {
      toast.error(`Something went wrong ${err} `);
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    setLoading(id);
    try {
      const res = await fetch(`/api/user/addresses?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setAddresses(data.addresses);
        toast.success("Address deleted");
      }
    } catch (err) {
      toast.error(`Failed to delete address ${err}`);
    } finally {
      setLoading(null);
    }
  };

  const toggleDefault = async (id: string) => {
    setLoading(id);
    try {
      const res = await fetch("/api/user/addresses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isDefault: true }),
      });
      const data = await res.json();
      if (data.success) {
        setAddresses(data.addresses);
        toast.success("Default address updated");
      }
    } catch (err) {
      toast.error(`Failed to update default address ${err}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header with Add Button */}
      {!showAddForm && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 size-48 bg-primary/5 rounded-full blur-[60px] -mr-24 -mt-24 transition-transform group-hover:scale-125" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <MapPin className="size-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 uppercase tracking-tight">
                Saved Addresses
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {addresses.length} Addresses total
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="rounded-2xl px-8 h-14 font-black uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
          >
            <Plus className="size-4" /> Add New Address
          </Button>
        </div>
      )}

      {/* Add New Address Form */}
      {showAddForm && (
        <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] border border-slate-200 shadow-2xl relative animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Add New Address
            </h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="size-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          <form onSubmit={handleAdd} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Label (e.g. Home, Office)
                </label>
                <div className="flex gap-2">
                  {["Home", "Office"].map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, label: l }))}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        formData.label === l
                          ? "bg-primary text-white shadow-lg"
                          : "bg-slate-50 text-slate-400 hover:bg-slate-100",
                      )}
                    >
                      {l === "Home" ? (
                        <Home className="size-3 inline mr-1" />
                      ) : (
                        <Briefcase className="size-3 inline mr-1" />
                      )}
                      {l}
                    </button>
                  ))}
                  <Input
                    placeholder="Other"
                    className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs px-4"
                    value={
                      formData.label !== "Home" && formData.label !== "Office"
                        ? formData.label
                        : ""
                    }
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, label: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Full Name
                </label>
                <Input
                  required
                  placeholder="Enter name"
                  className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-base px-6"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Phone Number
                </label>
                <Input
                  required
                  placeholder="017XXXXXXXX"
                  className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-base px-6"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, phone: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Address Details
                </label>
                <Input
                  required
                  placeholder="House #, Road #, Area"
                  className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-base px-6"
                  value={formData.addressLine1}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, addressLine1: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  City
                </label>
                <Input
                  required
                  placeholder="e.g. Dhaka"
                  className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-base px-6"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, city: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  District
                </label>
                <Input
                  required
                  placeholder="e.g. Dhaka"
                  className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-base px-6"
                  value={formData.district}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, district: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Postal Code
                </label>
                <Input
                  required
                  placeholder="e.g. 1200"
                  className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-base px-6"
                  value={formData.postalCode}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, postalCode: e.target.value }))
                  }
                />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer group w-fit">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, isDefault: e.target.checked }))
                }
                className="size-5 rounded-md border-slate-300 text-primary focus:ring-primary/20"
              />
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest group-hover:text-slate-900 transition-colors">
                Set as default address
              </span>
            </label>

            <div className="pt-6 flex gap-4">
              <Button
                type="submit"
                disabled={loading === "adding"}
                className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-primary/20"
              >
                {loading === "adding" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Add Address
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAddForm(false)}
                className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px]"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Addresses Grid */}
      <div className="grid sm:grid-cols-2 gap-6">
        {addresses.map((addr) => (
          <div
            key={addr._id}
            className={cn(
              "bg-white p-8 rounded-[2.5rem] border-2 transition-all relative group overflow-hidden",
              addr.isDefault
                ? "border-primary shadow-xl shadow-primary/5"
                : "border-slate-100 hover:border-slate-200",
            )}
          >
            {addr.isDefault && (
              <div className="absolute top-0 right-0 py-2 px-6 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-bl-3xl">
                Default
              </div>
            )}

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                  {addr.label === "Home" ? (
                    <Home className="size-5" />
                  ) : addr.label === "Office" ? (
                    <Briefcase className="size-5" />
                  ) : (
                    <MapPin className="size-5" />
                  )}
                </div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  {addr.label}
                </h4>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none">
                    Name
                  </p>
                  <p className="text-sm font-black text-slate-900 truncate">
                    {addr.name}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none">
                    Phone
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {addr.phone}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none">
                    Address
                  </p>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed italic">
                    {addr.addressLine1}, {addr.district}, {addr.city} -{" "}
                    {addr.postalCode}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                {!addr.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={loading === addr._id}
                    onClick={() => toggleDefault(addr._id)}
                    className="h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary/5 hover:text-primary text-slate-400"
                  >
                    Set Default
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={loading === addr._id || addr.isDefault}
                  onClick={() => handleDelete(addr._id)}
                  className="h-9 w-9 rounded-xl text-rose-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                  title={
                    addr.isDefault
                      ? "Cannot delete default address"
                      : "Delete address"
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {addresses.length === 0 && !showAddForm && (
          <div className="sm:col-span-2 text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
            <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="size-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">
              No Address Found
            </h3>
            <p className="text-xs font-medium text-slate-500 mb-6 uppercase tracking-widest">
              Add your shipping details to speed up checkout.
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[10px] gap-2"
            >
              <Plus className="size-4" /> Add your first address
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
