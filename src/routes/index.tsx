import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App });

import { QueryClient } from "@tanstack/query-core";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import {
  createCollection,
  createOptimisticAction,
  useLiveQuery,
} from "@tanstack/react-db";

type Item = {
  _id: string;
  name: string;
};

type IdItem = {
  id: string;
  name: string;
};

const queryClient = new QueryClient();

const collection = createCollection(
  queryCollectionOptions({
    queryKey: ["testCollection"],
    queryClient,
    getKey: (it) => it._id,
    queryFn: async () => {
      return [
        { name: "Bob", _id: "bob1" },
        { name: "Kevin", _id: "kevin1" },
        { name: "Stuart", _id: "stuart1" },
      ] as Item[];
    },
  }),
);

const idCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["idCollection"],
    queryClient,
    getKey: (it) => it.id,
    queryFn: async () => {
      return [
        { name: "Bob", id: "bob1" },
        { name: "Kevin", id: "kevin1" },
        { name: "Stuart", id: "stuart1" },
      ] as IdItem[];
    },
  }),
);

function useItemsLiveQuery() {
  return useLiveQuery((q) => {
    return q.from({ item: collection }).orderBy(({ item }) => item.name, "asc");
  });
}

function useIdItemsLiveQuery() {
  return useLiveQuery((q) => {
    return q
      .from({ item: idCollection })
      .orderBy(({ item }) => item.name, "asc");
  });
}

const updateName = createOptimisticAction<Item>({
  onMutate: ({ _id, name }) => {
    collection.update(_id, (tag) => {
      tag.name = name;
    });
  },
  mutationFn: async ({ _id, name }) => {
    collection.utils.writeUpdate({ _id, name });
  },
});

const updateIdName = createOptimisticAction<IdItem>({
  onMutate: ({ id, name }) => {
    idCollection.update(id, (tag) => {
      tag.name = name;
    });
  },
  mutationFn: async ({ id, name }) => {
    idCollection.utils.writeUpdate({ id, name });
  },
});
function App() {
  const { data: items } = useItemsLiveQuery();
  const { data: idItems } = useIdItemsLiveQuery();
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <h2>Collection with _id</h2>
      <ol>
        {items.map((item) => (
          <li key={item.$key}>{item.name}</li>
        ))}
      </ol>

      <h2>Collection with id</h2>
      <ol>
        {idItems.map((item) => (
          <li key={item.$key}>{item.name}</li>
        ))}
      </ol>

      <button
        onClick={() => {
          void updateName({ _id: "stuart1", name: "Alvin" });
          void updateIdName({ id: "stuart1", name: "Alvin" });
        }}
      >
        rename stuart
      </button>
    </main>
  );
}
