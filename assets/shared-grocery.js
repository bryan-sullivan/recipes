(() => {
  "use strict";

  const root = document.getElementById("shared-grocery-app");
  if (!root) return;

  const projectUrl = root.dataset.supabaseUrl;
  const publishableKey = root.dataset.supabaseKey;
  const clientFactory = window.supabase && window.supabase.createClient;

  if (!clientFactory) {
    root.innerHTML = '<p class="grocery-error">The shared list could not load. Please refresh the page.</p>';
    return;
  }

  const db = clientFactory(projectUrl, publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const defaultItems = [
  {
    "category": "Produce",
    "name": "Baby Yukon Gold potatoes",
    "quantity": "1½ pounds",
    "sort_order": 1,
    "source": "weekly-plan",
    "seed_key": "Produce:Baby Yukon Gold potatoes"
  },
  {
    "category": "Produce",
    "name": "Green beans",
    "quantity": "Enough to bring your total to about 2 pounds",
    "sort_order": 2,
    "source": "weekly-plan",
    "seed_key": "Produce:Green beans"
  },
  {
    "category": "Produce",
    "name": "Cilantro",
    "quantity": "1 large bunch",
    "sort_order": 3,
    "source": "weekly-plan",
    "seed_key": "Produce:Cilantro"
  },
  {
    "category": "Produce",
    "name": "Flat-leaf parsley",
    "quantity": "1 large bunch",
    "sort_order": 4,
    "source": "weekly-plan",
    "seed_key": "Produce:Flat-leaf parsley"
  },
  {
    "category": "Produce",
    "name": "Zucchini",
    "quantity": "2",
    "sort_order": 5,
    "source": "weekly-plan",
    "seed_key": "Produce:Zucchini"
  },
  {
    "category": "Produce",
    "name": "Red bell pepper",
    "quantity": "1",
    "sort_order": 6,
    "source": "weekly-plan",
    "seed_key": "Produce:Red bell pepper"
  },
  {
    "category": "Produce",
    "name": "Broccoli",
    "quantity": "1 large head or about 1 pound",
    "sort_order": 7,
    "source": "weekly-plan",
    "seed_key": "Produce:Broccoli"
  },
  {
    "category": "Produce",
    "name": "Red onions",
    "quantity": "2",
    "sort_order": 8,
    "source": "weekly-plan",
    "seed_key": "Produce:Red onions"
  },
  {
    "category": "Produce",
    "name": "Yellow or sweet onion",
    "quantity": "1",
    "sort_order": 9,
    "source": "weekly-plan",
    "seed_key": "Produce:Yellow or sweet onion"
  },
  {
    "category": "Produce",
    "name": "Cucumbers",
    "quantity": "4",
    "sort_order": 10,
    "source": "weekly-plan",
    "seed_key": "Produce:Cucumbers"
  },
  {
    "category": "Produce",
    "name": "Tomatoes",
    "quantity": "2–3",
    "sort_order": 11,
    "source": "weekly-plan",
    "seed_key": "Produce:Tomatoes"
  },
  {
    "category": "Produce",
    "name": "Jalapeño",
    "quantity": "1",
    "sort_order": 12,
    "source": "weekly-plan",
    "seed_key": "Produce:Jalapeño"
  },
  {
    "category": "Produce",
    "name": "Limes",
    "quantity": "4",
    "sort_order": 13,
    "source": "weekly-plan",
    "seed_key": "Produce:Limes"
  },
  {
    "category": "Produce",
    "name": "Lemons",
    "quantity": "3",
    "sort_order": 14,
    "source": "weekly-plan",
    "seed_key": "Produce:Lemons"
  },
  {
    "category": "Produce",
    "name": "Scallions",
    "quantity": "1 bunch",
    "sort_order": 15,
    "source": "weekly-plan",
    "seed_key": "Produce:Scallions"
  },
  {
    "category": "Produce",
    "name": "Shredded cabbage or slaw mix",
    "quantity": "1 bag",
    "sort_order": 16,
    "source": "weekly-plan",
    "seed_key": "Produce:Shredded cabbage or slaw mix"
  },
  {
    "category": "Produce",
    "name": "Shredded carrots",
    "quantity": "1 bag",
    "sort_order": 17,
    "source": "weekly-plan",
    "seed_key": "Produce:Shredded carrots"
  },
  {
    "category": "Produce",
    "name": "Fresh ginger",
    "quantity": "1 small hand",
    "sort_order": 18,
    "source": "weekly-plan",
    "seed_key": "Produce:Fresh ginger"
  },
  {
    "category": "Meat",
    "name": "Ground chicken",
    "quantity": "1½ pounds",
    "sort_order": 19,
    "source": "weekly-plan",
    "seed_key": "Meat:Ground chicken"
  },
  {
    "category": "Meat",
    "name": "Lean sirloin steak",
    "quantity": "1½ pounds",
    "sort_order": 20,
    "source": "weekly-plan",
    "seed_key": "Meat:Lean sirloin steak"
  },
  {
    "category": "Meat",
    "name": "Boneless, skinless chicken breasts or thighs for Peruvian chicken",
    "quantity": "2½ pounds",
    "sort_order": 21,
    "source": "weekly-plan",
    "seed_key": "Meat:Boneless, skinless chicken breasts or thighs for Peruvian chicken"
  },
  {
    "category": "Meat",
    "name": "Boneless, skinless chicken breast for Parmesan bowls",
    "quantity": "1½ pounds",
    "sort_order": 22,
    "source": "weekly-plan",
    "seed_key": "Meat:Boneless, skinless chicken breast for Parmesan bowls"
  },
  {
    "category": "Meat",
    "name": "Pork tenderloin",
    "quantity": "1½–1¾ pounds",
    "sort_order": 23,
    "source": "weekly-plan",
    "seed_key": "Meat:Pork tenderloin"
  },
  {
    "category": "Meat",
    "name": "90% lean ground beef",
    "quantity": "1½ pounds",
    "sort_order": 24,
    "source": "weekly-plan",
    "seed_key": "Meat:90% lean ground beef"
  },
  {
    "category": "Dairy",
    "name": "Plain nonfat Greek yogurt",
    "quantity": "1 large tub",
    "sort_order": 25,
    "source": "weekly-plan",
    "seed_key": "Dairy:Plain nonfat Greek yogurt"
  },
  {
    "category": "Dairy",
    "name": "Part-skim shredded mozzarella",
    "quantity": "At least ¾ cup",
    "sort_order": 26,
    "source": "weekly-plan",
    "seed_key": "Dairy:Part-skim shredded mozzarella"
  },
  {
    "category": "Dairy",
    "name": "Grated Parmesan",
    "quantity": "At least ¾ cup",
    "sort_order": 27,
    "source": "weekly-plan",
    "seed_key": "Dairy:Grated Parmesan"
  },
  {
    "category": "Canned and jarred",
    "name": "Cannellini beans",
    "quantity": "1 can",
    "sort_order": 28,
    "source": "weekly-plan",
    "seed_key": "Canned and jarred:Cannellini beans"
  },
  {
    "category": "Canned and jarred",
    "name": "Marinara sauce",
    "quantity": "1 jar",
    "sort_order": 29,
    "source": "weekly-plan",
    "seed_key": "Canned and jarred:Marinara sauce"
  },
  {
    "category": "Bread, pasta and rice",
    "name": "Panko breadcrumbs",
    "quantity": "At least ½ cup",
    "sort_order": 30,
    "source": "weekly-plan",
    "seed_key": "Bread, pasta and rice:Panko breadcrumbs"
  },
  {
    "category": "Bread, pasta and rice",
    "name": "Protein pasta or regular pasta",
    "quantity": "8 ounces",
    "sort_order": 31,
    "source": "weekly-plan",
    "seed_key": "Bread, pasta and rice:Protein pasta or regular pasta"
  },
  {
    "category": "Bread, pasta and rice",
    "name": "Rice",
    "quantity": "Enough for 2 cups cooked",
    "sort_order": 32,
    "source": "weekly-plan",
    "seed_key": "Bread, pasta and rice:Rice"
  },
  {
    "category": "Bread, pasta and rice",
    "name": "Small pita bread",
    "quantity": "4, optional",
    "sort_order": 33,
    "source": "weekly-plan",
    "seed_key": "Bread, pasta and rice:Small pita bread"
  },
  {
    "category": "Sauces and condiments",
    "name": "Gochujang",
    "quantity": "",
    "sort_order": 34,
    "source": "weekly-plan",
    "seed_key": "Sauces and condiments:Gochujang"
  },
  {
    "category": "Sauces and condiments",
    "name": "Low-sodium soy sauce",
    "quantity": "",
    "sort_order": 35,
    "source": "weekly-plan",
    "seed_key": "Sauces and condiments:Low-sodium soy sauce"
  },
  {
    "category": "Sauces and condiments",
    "name": "Rice vinegar",
    "quantity": "",
    "sort_order": 36,
    "source": "weekly-plan",
    "seed_key": "Sauces and condiments:Rice vinegar"
  },
  {
    "category": "Sauces and condiments",
    "name": "Worcestershire sauce",
    "quantity": "",
    "sort_order": 37,
    "source": "weekly-plan",
    "seed_key": "Sauces and condiments:Worcestershire sauce"
  },
  {
    "category": "Sauces and condiments",
    "name": "Toasted sesame oil",
    "quantity": "",
    "sort_order": 38,
    "source": "weekly-plan",
    "seed_key": "Sauces and condiments:Toasted sesame oil"
  },
  {
    "category": "Sauces and condiments",
    "name": "Honey",
    "quantity": "",
    "sort_order": 39,
    "source": "weekly-plan",
    "seed_key": "Sauces and condiments:Honey"
  },
  {
    "category": "Pantry check",
    "name": "Olive oil",
    "quantity": "",
    "sort_order": 40,
    "source": "weekly-plan",
    "seed_key": "Pantry check:Olive oil"
  },
  {
    "category": "Pantry check",
    "name": "Butter",
    "quantity": "",
    "sort_order": 41,
    "source": "weekly-plan",
    "seed_key": "Pantry check:Butter"
  },
  {
    "category": "Pantry check",
    "name": "Low-sodium chicken broth",
    "quantity": "",
    "sort_order": 42,
    "source": "weekly-plan",
    "seed_key": "Pantry check:Low-sodium chicken broth"
  },
  {
    "category": "Pantry check",
    "name": "Ground cumin",
    "quantity": "",
    "sort_order": 43,
    "source": "weekly-plan",
    "seed_key": "Pantry check:Ground cumin"
  },
  {
    "category": "Pantry check",
    "name": "Ground coriander",
    "quantity": "",
    "sort_order": 44,
    "source": "weekly-plan",
    "seed_key": "Pantry check:Ground coriander"
  },
  {
    "category": "Pantry check",
    "name": "Smoked paprika",
    "quantity": "",
    "sort_order": 45,
    "source": "weekly-plan",
    "seed_key": "Pantry check:Smoked paprika"
  },
  {
    "category": "Pantry check",
    "name": "Dried oregano",
    "quantity": "",
    "sort_order": 46,
    "source": "weekly-plan",
    "seed_key": "Pantry check:Dried oregano"
  },
  {
    "category": "Pantry check",
    "name": "Italian seasoning",
    "quantity": "",
    "sort_order": 47,
    "source": "weekly-plan",
    "seed_key": "Pantry check:Italian seasoning"
  },
  {
    "category": "Pantry check",
    "name": "Garlic powder",
    "quantity": "",
    "sort_order": 48,
    "source": "weekly-plan",
    "seed_key": "Pantry check:Garlic powder"
  },
  {
    "category": "Pantry check",
    "name": "Ground cinnamon",
    "quantity": "",
    "sort_order": 49,
    "source": "weekly-plan",
    "seed_key": "Pantry check:Ground cinnamon"
  },
  {
    "category": "Pantry check",
    "name": "Red pepper flakes",
    "quantity": "",
    "sort_order": 50,
    "source": "weekly-plan",
    "seed_key": "Pantry check:Red pepper flakes"
  },
  {
    "category": "Pantry check",
    "name": "Sesame seeds",
    "quantity": "Optional",
    "sort_order": 51,
    "source": "weekly-plan",
    "seed_key": "Pantry check:Sesame seeds"
  },
  {
    "category": "Pantry check",
    "name": "Kosher salt",
    "quantity": "",
    "sort_order": 52,
    "source": "weekly-plan",
    "seed_key": "Pantry check:Kosher salt"
  },
  {
    "category": "Pantry check",
    "name": "Black pepper",
    "quantity": "",
    "sort_order": 53,
    "source": "weekly-plan",
    "seed_key": "Pantry check:Black pepper"
  }
];

  const categoryOrder = [
    "Produce", "Meat", "Dairy", "Canned and jarred",
    "Bread, pasta and rice", "Sauces and condiments", "Pantry check", "Other"
  ];

  const state = {
    user: null,
    household: null,
    membership: null,
    list: null,
    items: [],
    channel: null,
    connecting: false,
    bulkBusy: false
  };

  const ui = {
    auth: document.getElementById("grocery-auth"),
    authForm: document.getElementById("grocery-auth-form"),
    authInvite: document.getElementById("grocery-device-invite"),
    authStatus: document.getElementById("grocery-auth-status"),
    setup: document.getElementById("grocery-setup"),
    createHousehold: document.getElementById("create-household"),
    joinForm: document.getElementById("join-household-form"),
    inviteInput: document.getElementById("invite-code"),
    setupStatus: document.getElementById("grocery-setup-status"),
    listPanel: document.getElementById("grocery-list-panel"),
    householdName: document.getElementById("grocery-household-name"),
    signedInAs: document.getElementById("grocery-signed-in-as"),
    signOut: document.getElementById("grocery-sign-out"),
    inviteCode: document.getElementById("household-invite-code"),
    copyInvite: document.getElementById("copy-household-invite"),
    inviteStatus: document.getElementById("invite-status"),
    addForm: document.getElementById("grocery-add-form"),
    itemName: document.getElementById("grocery-item-name"),
    itemQuantity: document.getElementById("grocery-item-quantity"),
    itemCategory: document.getElementById("grocery-item-category"),
    addStatus: document.getElementById("grocery-add-status"),
    progress: document.getElementById("grocery-progress"),
    bulkActions: document.getElementById("grocery-bulk-actions"),
    checkAll: document.getElementById("grocery-check-all"),
    uncheckAll: document.getElementById("grocery-uncheck-all"),
    deleteChecked: document.getElementById("grocery-delete-checked"),
    deleteAll: document.getElementById("grocery-delete-all"),
    bulkStatus: document.getElementById("grocery-bulk-status"),
    items: document.getElementById("grocery-items"),
    syncStatus: document.getElementById("grocery-sync-status")
  };

  function show(element, visible) {
    element.hidden = !visible;
  }

  function message(element, text, tone) {
    element.textContent = text || "";
    element.dataset.tone = tone || "";
  }

  function cleanError(error) {
    if (!error) return "Something went wrong.";
    return error.message || String(error);
  }

  function inviteFromUrl() {
    return new URLSearchParams(window.location.search).get("invite") || "";
  }

  function inviteLink() {
    const url = new URL("../grocery-list.html", window.location.href);
    url.hash = "";
    url.search = "";
    url.searchParams.set("invite", state.household.invite_code);
    return url.toString();
  }

  async function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    document.execCommand("copy");
    field.remove();
  }

  async function seedList() {
    if (!state.list || state.list.seeded) return;

    const rows = defaultItems.map(item => ({
      list_id: state.list.id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      sort_order: item.sort_order,
      source: item.source,
      seed_key: item.seed_key,
      created_by: state.user.id
    }));

    const inserted = await db
      .from("grocery_items")
      .upsert(rows, { onConflict: "list_id,seed_key", ignoreDuplicates: true });

    if (inserted.error) throw inserted.error;

    const updated = await db
      .from("grocery_lists")
      .update({ seeded: true })
      .eq("id", state.list.id);

    if (updated.error) throw updated.error;
    state.list.seeded = true;
  }

  async function loadItems() {
    if (!state.list) return;

    const result = await db
      .from("grocery_items")
      .select("*")
      .eq("list_id", state.list.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (result.error) {
      message(ui.syncStatus, cleanError(result.error), "error");
      return;
    }

    state.items = result.data || [];
    renderItems();
    message(ui.syncStatus, "Synced just now", "success");
  }

  function updateBulkControls() {
    const total = state.items.length;
    const checked = state.items.filter(item => item.checked).length;
    ui.checkAll.disabled = state.bulkBusy || total === 0 || checked === total;
    ui.uncheckAll.disabled = state.bulkBusy || checked === 0;
    ui.deleteChecked.disabled = state.bulkBusy || checked === 0;
    ui.deleteAll.disabled = state.bulkBusy || total === 0;
  }

  function renderItems() {
    ui.items.replaceChildren();

    const checkedCount = state.items.filter(item => item.checked).length;
    ui.progress.textContent = checkedCount + " of " + state.items.length + " items checked";
    updateBulkControls();

    const grouped = new Map();
    state.items.forEach(item => {
      const category = item.category || "Other";
      if (!grouped.has(category)) grouped.set(category, []);
      grouped.get(category).push(item);
    });

    const categories = Array.from(grouped.keys()).sort((a, b) => {
      const ai = categoryOrder.indexOf(a);
      const bi = categoryOrder.indexOf(b);
      const av = ai === -1 ? 999 : ai;
      const bv = bi === -1 ? 999 : bi;
      return av - bv || a.localeCompare(b);
    });

    categories.forEach(category => {
      const section = document.createElement("section");
      section.className = "grocery-category";

      const heading = document.createElement("h2");
      heading.textContent = category;
      section.appendChild(heading);

      const list = document.createElement("ul");
      list.className = "shared-checklist";

      grouped.get(category).forEach(item => {
        const row = document.createElement("li");
        row.dataset.itemId = item.id;
        if (item.checked) row.classList.add("is-checked");

        const label = document.createElement("label");
        label.className = "grocery-item-label";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = item.checked;
        checkbox.dataset.action = "toggle";
        checkbox.setAttribute("aria-label", "Check " + item.name);

        const text = document.createElement("span");
        text.className = "grocery-item-text";

        const name = document.createElement("strong");
        name.textContent = item.name;
        text.appendChild(name);

        if (item.quantity) {
          const quantity = document.createElement("span");
          quantity.className = "grocery-item-quantity";
          quantity.textContent = item.quantity;
          text.appendChild(quantity);
        }

        label.append(checkbox, text);

        const actions = document.createElement("div");
        actions.className = "grocery-item-actions";

        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "grocery-icon-button";
        edit.dataset.action = "edit";
        edit.textContent = "Edit";
        edit.setAttribute("aria-label", "Edit " + item.name);

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "grocery-icon-button grocery-delete";
        remove.dataset.action = "delete";
        remove.textContent = "Delete";
        remove.setAttribute("aria-label", "Delete " + item.name);

        actions.append(edit, remove);
        row.append(label, actions);
        list.appendChild(row);
      });

      section.appendChild(list);
      ui.items.appendChild(section);
    });

    if (!state.items.length) {
      const empty = document.createElement("p");
      empty.className = "grocery-empty";
      empty.textContent = "The list is empty. Add the first item above.";
      ui.items.appendChild(empty);
    }
  }

  async function subscribeToItems() {
    if (state.channel) await db.removeChannel(state.channel);

    state.channel = db
      .channel("grocery-list-" + state.list.id)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "grocery_items",
          filter: "list_id=eq." + state.list.id
        },
        () => loadItems()
      )
      .subscribe(status => {
        if (status === "SUBSCRIBED") message(ui.syncStatus, "Live sync connected", "success");
      });
  }

  async function loadContext() {
    const membershipResult = await db
      .from("household_members")
      .select("role, household_id, households(id, name, invite_code)")
      .eq("user_id", state.user.id)
      .maybeSingle();

    if (membershipResult.error) throw membershipResult.error;

    if (!membershipResult.data) {
      state.household = null;
      state.membership = null;
      state.list = null;
      show(ui.auth, false);
      show(ui.setup, true);
      show(ui.listPanel, false);
      const code = inviteFromUrl();
      if (code) ui.inviteInput.value = code;
      return;
    }

    state.membership = membershipResult.data;
    state.household = membershipResult.data.households;

    const listResult = await db
      .from("grocery_lists")
      .select("*")
      .eq("household_id", state.household.id)
      .eq("active", true)
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (listResult.error) throw listResult.error;

    if (!listResult.data) {
      const created = await db
        .from("grocery_lists")
        .insert({
          household_id: state.household.id,
          title: "Wegmans Grocery List — August 31–September 5, 2026",
          week_start: "2026-08-31",
          created_by: state.user.id
        })
        .select()
        .single();
      if (created.error) throw created.error;
      state.list = created.data;
    } else {
      state.list = listResult.data;
    }

    await seedList();

    show(ui.auth, false);
    show(ui.setup, false);
    show(ui.listPanel, true);
    ui.householdName.textContent = state.household.name;
    ui.signedInAs.textContent = state.user.is_anonymous
      ? "Connected on this device"
      : state.user.email || "Connected on this device";
    ui.inviteCode.textContent = state.household.invite_code;

    await loadItems();
    await subscribeToItems();
  }

  async function handleSession(session) {
    state.user = session && session.user ? session.user : null;

    if (!state.user) {
      if (state.channel) {
        await db.removeChannel(state.channel);
        state.channel = null;
      }
      show(ui.auth, true);
      show(ui.setup, false);
      show(ui.listPanel, false);
      return;
    }

    try {
      await loadContext();
    } catch (error) {
      show(ui.auth, false);
      show(ui.setup, true);
      show(ui.listPanel, false);
      message(ui.setupStatus, cleanError(error), "error");
    }
  }

  async function joinWithCode(code, statusElement) {
    if (!code) return false;

    state.connecting = true;
    message(statusElement, "Connecting this device to the family list…", "");

    try {
      if (!state.user) {
        const authResult = await db.auth.signInAnonymously();
        if (authResult.error) throw authResult.error;
        state.user = authResult.data.user;
      }

      const result = await db.rpc("join_household", { join_code: code });
      if (result.error) throw result.error;

      const url = new URL(window.location.href);
      url.searchParams.delete("invite");
      window.history.replaceState({}, "", url);
      await loadContext();
      return true;
    } catch (error) {
      message(statusElement, cleanError(error), "error");
      return false;
    } finally {
      state.connecting = false;
    }
  }

  ui.authForm.addEventListener("submit", async event => {
    event.preventDefault();
    await joinWithCode(ui.authInvite.value.trim(), ui.authStatus);
  });

  ui.createHousehold.addEventListener("click", async () => {
    ui.createHousehold.disabled = true;
    message(ui.setupStatus, "Creating your shared family list…", "");
    const result = await db.rpc("create_household", {
      household_name: "Sullivan Family Grocery List"
    });
    ui.createHousehold.disabled = false;

    if (result.error) {
      message(ui.setupStatus, cleanError(result.error), "error");
      return;
    }

    message(ui.setupStatus, "Family list created.", "success");
    await loadContext();
  });

  ui.joinForm.addEventListener("submit", async event => {
    event.preventDefault();
    await joinWithCode(ui.inviteInput.value.trim(), ui.setupStatus);
  });

  ui.copyInvite.addEventListener("click", async () => {
    try {
      await copyText(inviteLink());
      message(ui.inviteStatus, "Invite link copied. Send it privately to your wife.", "success");
    } catch {
      message(ui.inviteStatus, "Could not copy automatically. Copy the invite code instead.", "error");
    }
  });

  ui.signOut.addEventListener("click", async () => {
    await db.auth.signOut();
  });

  ui.addForm.addEventListener("submit", async event => {
    event.preventDefault();
    const name = ui.itemName.value.trim();
    const quantity = ui.itemQuantity.value.trim();
    const category = ui.itemCategory.value;
    if (!name) return;

    const maxOrder = state.items.reduce((max, item) => Math.max(max, item.sort_order || 0), 0);
    const result = await db
      .from("grocery_items")
      .insert({
        list_id: state.list.id,
        name,
        quantity,
        category,
        sort_order: maxOrder + 1,
        source: "manual",
        created_by: state.user.id
      });

    if (result.error) {
      message(ui.addStatus, cleanError(result.error), "error");
      return;
    }

    ui.addForm.reset();
    ui.itemCategory.value = "Other";
    message(ui.addStatus, name + " added.", "success");
    await loadItems();
  });

  async function runBulkAction(action) {
    const total = state.items.length;
    const checked = state.items.filter(item => item.checked).length;
    if (!total || state.bulkBusy) return;

    if (action === "delete-checked") {
      if (!checked || !window.confirm("Delete " + checked + " checked item" + (checked === 1 ? "" : "s") + "? This cannot be undone.")) return;
    }

    if (action === "delete-all") {
      if (!window.confirm("Delete all " + total + " items from the grocery list? This cannot be undone.")) return;
    }

    state.bulkBusy = true;
    updateBulkControls();
    message(ui.bulkStatus, "Updating the list…", "");

    try {
      let result;

      if (action === "check-all") {
        result = await db.from("grocery_items").update({ checked: true }).eq("list_id", state.list.id);
      } else if (action === "uncheck-all") {
        result = await db.from("grocery_items").update({ checked: false }).eq("list_id", state.list.id);
      } else if (action === "delete-checked") {
        result = await db.from("grocery_items").delete().eq("list_id", state.list.id).eq("checked", true);
      } else if (action === "delete-all") {
        result = await db.from("grocery_items").delete().eq("list_id", state.list.id);
      } else {
        return;
      }

      if (result.error) throw result.error;

      const successMessages = {
        "check-all": "All items checked.",
        "uncheck-all": "All items unchecked.",
        "delete-checked": checked + " checked item" + (checked === 1 ? "" : "s") + " deleted.",
        "delete-all": "All items deleted."
      };
      message(ui.bulkStatus, successMessages[action], "success");
      await loadItems();
    } catch (error) {
      message(ui.bulkStatus, cleanError(error), "error");
    } finally {
      state.bulkBusy = false;
      updateBulkControls();
    }
  }

  ui.bulkActions.addEventListener("click", event => {
    const button = event.target.closest("[data-bulk-action]");
    if (button) runBulkAction(button.dataset.bulkAction);
  });

  ui.items.addEventListener("change", async event => {
    const checkbox = event.target.closest('[data-action="toggle"]');
    if (!checkbox) return;

    const row = checkbox.closest("[data-item-id]");
    const result = await db
      .from("grocery_items")
      .update({ checked: checkbox.checked })
      .eq("id", row.dataset.itemId);

    if (result.error) {
      checkbox.checked = !checkbox.checked;
      message(ui.syncStatus, cleanError(result.error), "error");
    } else {
      await loadItems();
    }
  });

  ui.items.addEventListener("click", async event => {
    const button = event.target.closest("[data-action]");
    if (!button || button.dataset.action === "toggle") return;

    const row = button.closest("[data-item-id]");
    const item = state.items.find(candidate => candidate.id === row.dataset.itemId);
    if (!item) return;

    if (button.dataset.action === "edit") {
      const name = window.prompt("Item name", item.name);
      if (name === null || !name.trim()) return;
      const quantity = window.prompt("Quantity or note", item.quantity || "");
      if (quantity === null) return;

      const result = await db
        .from("grocery_items")
        .update({ name: name.trim(), quantity: quantity.trim() })
        .eq("id", item.id);

      if (result.error) message(ui.syncStatus, cleanError(result.error), "error");
      else await loadItems();
    }

    if (button.dataset.action === "delete") {
      if (!window.confirm("Delete " + item.name + " from the shared list?")) return;
      const result = await db.from("grocery_items").delete().eq("id", item.id);
      if (result.error) message(ui.syncStatus, cleanError(result.error), "error");
      else await loadItems();
    }
  });

  async function start() {
    const sessionResult = await db.auth.getSession();
    await handleSession(sessionResult.data.session);

    const code = inviteFromUrl();
    if (code && !state.membership) {
      await joinWithCode(code, state.user ? ui.setupStatus : ui.authStatus);
    }

    db.auth.onAuthStateChange((event, session) => {
      if (event !== "INITIAL_SESSION" && !state.connecting) handleSession(session);
    });

    root.dataset.ready = "true";
  }

  start().catch(error => {
    message(ui.authStatus, cleanError(error), "error");
  });
})();
