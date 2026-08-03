import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { addToCart, updateQty, removeFromCart } from "@/actions/cart";
import { toast } from "sonner";
import { ICart, ICartItem, IPopulatedCartItem } from "@/types/cart";

export function useCart() {
  const queryClient = useQueryClient();

  const { data: session } = useSession();
  const userId = session?.user?.id || "guest";

  // 1. Fetch Cart Count (Optimized for small data)
  const { data: cartCount = 0, isLoading: isLoadingCount } = useQuery({
    queryKey: ["cart-count", userId],
    queryFn: async () => {
      const res = await fetch("/api/cart/count");
      const data = await res.json();
      return data.count as number;
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  // 2. Fetch Full Cart Details
  const {
    data: cartData = { items: [], total: 0 },
    isLoading: isLoadingCart,
    isFetching: isFetchingCart,
  } = useQuery({
      queryKey: ["cart-details", userId],
      queryFn: async () => {
        const res = await fetch("/api/cart");
        return await res.json();
      },
      staleTime: 30 * 1000,
    });

  // 3. Add to Cart Mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({
      productId,
      quantity,
      color,
      size,
    }: {
      productId: string;
      quantity: number;
      color?: string;
      size?: string;
    }) => {
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("itemQuantity", quantity.toString());
      if (color) formData.append("color", color);
      if (size) formData.append("size", size);
      return addToCart(formData);
    },
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ["cart-count", userId] });
      await queryClient.cancelQueries({ queryKey: ["cart-details", userId] });

      const previousCount = queryClient.getQueryData(["cart-count", userId]);
      const previousDetails = queryClient.getQueryData([
        "cart-details",
        userId,
      ]);

      queryClient.setQueryData(["cart-count", userId], (old: number = 0) => {
        const cart = previousDetails as
          | { items?: (ICartItem | IPopulatedCartItem)[] }
          | undefined;
        const alreadyInCart = cart?.items?.some((item) => {
          const id =
            typeof item.product === "object" ? item.product._id : item.product;
          return (
            String(id) === newItem.productId &&
            (item.color || "") === (newItem.color || "") &&
            (item.size || "") === (newItem.size || "")
          );
        });
        return alreadyInCart ? old : old + 1;
      });

      return { previousCount, previousDetails };
    },
    onSuccess: (data) => {
      if (!data.success) {
        toast.error(data.error || "Failed to add to cart");
      }
    },
    onError: (err, newItem, context) => {
      if (context) {
        queryClient.setQueryData(["cart-count", userId], context.previousCount);
        queryClient.setQueryData(
          ["cart-details", userId],
          context.previousDetails,
        );
      }
      toast.error("Something went wrong");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-count", userId] });
      queryClient.invalidateQueries({ queryKey: ["cart-details", userId] });
    },
  });

  // 4. Update Qty Mutation
  const updateQtyMutation = useMutation({
    mutationFn: async ({
      productId,
      quantity,
      color,
      size,
    }: {
      productId: string;
      quantity: number;
      color?: string;
      size?: string;
    }) => {
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("itemQuantity", quantity.toString());
      if (color) formData.append("color", color);
      if (size) formData.append("size", size);
      return updateQty(formData);
    },
    onMutate: async (updatedItem) => {
      await queryClient.cancelQueries({ queryKey: ["cart-count", userId] });
      await queryClient.cancelQueries({ queryKey: ["cart-details", userId] });

      const previousCount = queryClient.getQueryData<number>([
        "cart-count",
        userId,
      ]);
      const previousDetails = queryClient.getQueryData<
        ICart & { items: (ICartItem | IPopulatedCartItem)[] }
      >(["cart-details", userId]);

      if (previousDetails?.items) {
        const item = previousDetails.items.find(
          (i: ICartItem | IPopulatedCartItem) => {
            const id =
              typeof i.product === "object"
                ? String(i.product._id)
                : String(i.product);
            return (
              id === updatedItem.productId &&
              (i.color || "") === (updatedItem.color || "") &&
              (i.size || "") === (updatedItem.size || "")
            );
          },
        );

        if (item) {
          queryClient.setQueryData(["cart-details", userId], {
            ...previousDetails,
            items: previousDetails.items.map(
              (i: ICartItem | IPopulatedCartItem) => {
                const id =
                  typeof i.product === "object"
                    ? String(i.product._id)
                    : String(i.product);
                return id === updatedItem.productId &&
                  (i.color || "") === (updatedItem.color || "") &&
                  (i.size || "") === (updatedItem.size || "")
                  ? { ...i, itemQuantity: updatedItem.quantity }
                  : i;
              },
            ),
          });
        }
      }

      return { previousCount, previousDetails };
    },
    onError: (err, newItem, context) => {
      if (context) {
        queryClient.setQueryData(["cart-count", userId], context.previousCount);
        queryClient.setQueryData(
          ["cart-details", userId],
          context.previousDetails,
        );
      }
      toast.error("কোয়ান্টিটি আপডেট করা যায়নি");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-count", userId] });
      queryClient.invalidateQueries({ queryKey: ["cart-details", userId] });
    },
  });

  // 5. Remove Item Mutation
  const removeItemMutation = useMutation({
    mutationFn: async ({
      productId,
      color,
      size,
    }: {
      productId: string;
      color?: string;
      size?: string;
    }) => {
      const formData = new FormData();
      formData.append("productId", productId);
      if (color) formData.append("color", color);
      if (size) formData.append("size", size);
      return removeFromCart(formData);
    },
    onMutate: async ({ productId, color, size }) => {
      await queryClient.cancelQueries({ queryKey: ["cart-count", userId] });
      await queryClient.cancelQueries({ queryKey: ["cart-details", userId] });

      const previousCount = queryClient.getQueryData<number>([
        "cart-count",
        userId,
      ]);
      const previousDetails = queryClient.getQueryData<
        ICart & { items: (ICartItem | IPopulatedCartItem)[] }
      >(["cart-details", userId]);

      if (previousDetails?.items) {
        const itemToRemove = previousDetails.items.find(
          (i: ICartItem | IPopulatedCartItem) => {
            const id =
              typeof i.product === "object"
                ? String(i.product._id)
                : String(i.product);
            return (
              id === productId &&
              (i.color || "") === (color || "") &&
              (i.size || "") === (size || "")
            );
          },
        );

        if (itemToRemove) {
          queryClient.setQueryData(["cart-details", userId], {
            ...previousDetails,
            items: previousDetails.items.filter(
              (i: ICartItem | IPopulatedCartItem) => {
                const id =
                  typeof i.product === "object"
                    ? String(i.product._id)
                    : String(i.product);
                return !(
                  id === productId &&
                  (i.color || "") === (color || "") &&
                  (i.size || "") === (size || "")
                );
              },
            ),
          });

          queryClient.setQueryData(["cart-count", userId], (old: number = 0) =>
            Math.max(0, old - 1),
          );
        }
      }

      return { previousCount, previousDetails };
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("আইটেম রিমুভ করা হয়েছে");
      }
    },
    onError: (err, newItem, context) => {
      if (context) {
        queryClient.setQueryData(["cart-count", userId], context.previousCount);
        queryClient.setQueryData(
          ["cart-details", userId],
          context.previousDetails,
        );
      }
      toast.error("রিমুভ করা সম্ভব হয়নি");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-count", userId] });
      queryClient.invalidateQueries({ queryKey: ["cart-details", userId] });
    },
  });

  return {
    cartCount,
    cart: cartData,
    isLoadingCount,
    isLoadingCart,
    isFetchingCart,
    addToCart: addToCartMutation.mutate,
    isAdding: addToCartMutation.isPending,
    updateQty: updateQtyMutation.mutate,
    isUpdating: updateQtyMutation.isPending,
    removeItem: removeItemMutation.mutate,
    isRemoving: removeItemMutation.isPending,
  };
}
