(() => {
  "use strict";

  const projectUrl = "https://wjxmozhornzttaegyvxo.supabase.co";
  const publishableKey = "sb_publishable_rlHOU9-Kqv9yzK-yw2H4SA_qDcog2yC";
  const clientFactory = window.supabase && window.supabase.createClient;
  const widgets = [...document.querySelectorAll("[data-rating-widget]")];
  if (!widgets.length) return;

  const localPrefix = "family-recipe-rating-v1:";
  const localStatusPrefix = "family-recipe-status-v1:";
  const preferences = new Map();
  const state = { db: null, user: null, householdId: null, channel: null };

  function normalizeRating(value) {
    const number = Number(value) || 0;
    return Math.max(0, Math.min(5, Math.round(number * 2) / 2));
  }

  function ratingLabel(value) {
    return value > 0 ? value + " / 5" : "Not rated";
  }

  function localRating(recipeId, fallback) {
    try {
      const saved = window.localStorage.getItem(localPrefix + recipeId);
      return normalizeRating(saved === null ? fallback : saved);
    } catch {
      return normalizeRating(fallback);
    }
  }

  function saveLocalRating(recipeId, value) {
    try {
      if (value > 0) window.localStorage.setItem(localPrefix + recipeId, String(value));
      else window.localStorage.removeItem(localPrefix + recipeId);
    } catch {}
  }

  function localStatus(recipeId) {
    try {
      return window.localStorage.getItem(localStatusPrefix + recipeId) === "retired" ? "retired" : "active";
    } catch {
      return "active";
    }
  }

  function saveLocalStatus(recipeId, status) {
    try {
      if (status === "retired") window.localStorage.setItem(localStatusPrefix + recipeId, "retired");
      else window.localStorage.removeItem(localStatusPrefix + recipeId);
    } catch {}
  }

  function paintRating(widget, value) {
    const normalized = normalizeRating(value);
    widget.dataset.currentRating = String(normalized);
    widget.querySelectorAll("[data-rating-star]").forEach(button => {
      const star = Number(button.dataset.ratingStar);
      button.dataset.fill = normalized >= star ? "full" : normalized >= star - 0.5 ? "half" : "empty";
      button.setAttribute("aria-pressed", normalized === star || normalized === star - 0.5 ? "true" : "false");
    });
    widget.querySelector("[data-rating-output]").textContent = ratingLabel(normalized);
    widget.querySelector("[data-clear-rating]").hidden = normalized === 0;
    const card = widget.closest(".card");
    if (card) card.dataset.rating = String(normalized);
    return normalized;
  }

  function statusElement() {
    let element = document.querySelector("[data-recipe-preference-status]");
    if (element) return element;
    element = document.createElement("p");
    element.className = "recipe-preference-status";
    element.dataset.recipePreferenceStatus = "";
    element.setAttribute("role", "status");
    const pageWidget = document.querySelector(".rating-widget-page");
    if (pageWidget) pageWidget.insertAdjacentElement("afterend", element);
    else document.querySelector("#recipes .results-summary")?.appendChild(element);
    return element;
  }

  function message(text, tone = "") {
    const element = statusElement();
    element.textContent = text || "";
    element.dataset.tone = tone;
  }

  function preference(recipeId, widget) {
    const existing = preferences.get(recipeId);
    if (existing) return existing;
    return {
      recipe_id: recipeId,
      rating: localRating(recipeId, widget?.dataset.initialRating || 0),
      status: localStatus(recipeId)
    };
  }

  function applyPreference(recipeId) {
    const relatedWidgets = widgets.filter(widget => widget.dataset.recipeId === recipeId);
    const current = preference(recipeId, relatedWidgets[0]);
    relatedWidgets.forEach(widget => {
      paintRating(widget, current.rating);
      const card = widget.closest(".card");
      if (card) {
        card.dataset.retired = String(current.status === "retired");
        const action = card.querySelector("[data-recipe-action]");
        if (action) {
          action.textContent = current.status === "retired" ? "Restore" : "Remove";
          action.dataset.recipeAction = current.status === "retired" ? "restore" : "retire";
        }
      }
    });

    const pageWidget = document.querySelector(`.rating-widget-page[data-recipe-id="${CSS.escape(recipeId)}"]`);
    if (pageWidget) {
      const action = document.querySelector("[data-recipe-page-action]");
      if (action) {
        action.textContent = current.status === "retired" ? "Restore to cookbook" : "Remove from cookbook";
        action.dataset.recipeAction = current.status === "retired" ? "restore" : "retire";
      }
      document.body.dataset.recipeRetired = String(current.status === "retired");
    }
    if (typeof window.applyRecipeFilters === "function") window.applyRecipeFilters();
  }

  function addActions() {
    document.querySelectorAll(".card [data-rating-widget]").forEach(widget => {
      const actions = widget.closest(".card")?.querySelector(".card-actions");
      if (!actions || actions.querySelector("[data-recipe-action]")) return;
      const button = document.createElement("button");
      button.className = "button recipe-remove-button";
      button.type = "button";
      button.textContent = "Remove";
      button.dataset.recipeAction = "retire";
      button.dataset.recipeId = widget.dataset.recipeId;
      actions.appendChild(button);
    });

    const pageWidget = document.querySelector(".rating-widget-page");
    if (pageWidget && !document.querySelector("[data-recipe-page-action]")) {
      const button = document.createElement("button");
      button.className = "button recipe-remove-button recipe-page-action";
      button.type = "button";
      button.textContent = "Remove from cookbook";
      button.dataset.recipeAction = "retire";
      button.dataset.recipePageAction = "";
      button.dataset.recipeId = pageWidget.dataset.recipeId;
      pageWidget.insertAdjacentElement("afterend", button);
    }
  }

  async function persist(recipeId, changes) {
    const widget = widgets.find(item => item.dataset.recipeId === recipeId);
    const current = { ...preference(recipeId, widget), ...changes };
    preferences.set(recipeId, current);
    applyPreference(recipeId);

    if (!state.householdId || !state.user) {
      if (Object.hasOwn(changes, "rating")) saveLocalRating(recipeId, current.rating);
      if (Object.hasOwn(changes, "status")) saveLocalStatus(recipeId, current.status);
      message("Saved on this device. Connect it through the shared grocery list to sync with the household.", "warning");
      return;
    }

    const result = await state.db.from("recipe_preferences").upsert({
      household_id: state.householdId,
      recipe_id: recipeId,
      rating: current.rating || null,
      status: current.status,
      updated_by: state.user.id
    }, { onConflict: "household_id,recipe_id" });

    if (result.error) {
      message("The change could not be saved. Please refresh and try again.", "error");
      return;
    }
    saveLocalRating(recipeId, current.rating);
    saveLocalStatus(recipeId, current.status);
    message(current.status === "retired" ? "Removed from the cookbook. Old menu links will still work." : "Saved for the household.", "success");
  }

  async function migrateLocalRatings() {
    const rows = [];
    widgets.forEach(widget => {
      const recipeId = widget.dataset.recipeId;
      if (preferences.has(recipeId)) return;
      const rating = localRating(recipeId, widget.dataset.initialRating || 0);
      const status = localStatus(recipeId);
      if (!rating && status === "active") return;
      rows.push({
        household_id: state.householdId,
        recipe_id: recipeId,
        rating,
        status,
        updated_by: state.user.id
      });
    });
    if (!rows.length) return;
    const result = await state.db.from("recipe_preferences").upsert(rows, {
      onConflict: "household_id,recipe_id",
      ignoreDuplicates: true
    });
    if (result.error) throw result.error;
    rows.forEach(row => preferences.set(row.recipe_id, row));
  }

  async function loadHouseholdPreferences(session) {
    state.user = session?.user || null;
    if (!state.user) {
      message("Connect this device through the shared grocery list to sync ratings and removals.");
      return;
    }
    const membership = await state.db.from("household_members")
      .select("household_id")
      .eq("user_id", state.user.id)
      .maybeSingle();
    if (membership.error) throw membership.error;
    if (!membership.data) {
      message("Connect this device through the shared grocery list to sync ratings and removals.");
      return;
    }
    state.householdId = membership.data.household_id;
    const result = await state.db.from("recipe_preferences")
      .select("recipe_id,rating,status")
      .eq("household_id", state.householdId);
    if (result.error) throw result.error;
    (result.data || []).forEach(row => preferences.set(row.recipe_id, {
      ...row,
      rating: normalizeRating(row.rating)
    }));
    await migrateLocalRatings();
    widgets.forEach(widget => applyPreference(widget.dataset.recipeId));
    message("Ratings and cookbook changes sync with the household.", "success");

    state.channel = state.db.channel("recipe-preferences-" + state.householdId)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "recipe_preferences",
        filter: "household_id=eq." + state.householdId
      }, payload => {
        const row = payload.new || payload.old;
        if (!row?.recipe_id) return;
        if (payload.eventType === "DELETE") preferences.delete(row.recipe_id);
        else preferences.set(row.recipe_id, { ...row, rating: normalizeRating(row.rating) });
        applyPreference(row.recipe_id);
      }).subscribe();
  }

  addActions();
  widgets.forEach(widget => paintRating(widget, localRating(widget.dataset.recipeId, widget.dataset.initialRating || 0)));

  document.addEventListener("click", event => {
    const action = event.target.closest("[data-recipe-action]");
    if (action) {
      persist(action.dataset.recipeId, { status: action.dataset.recipeAction === "retire" ? "retired" : "active" });
      return;
    }
    const star = event.target.closest("[data-rating-star]");
    if (star) {
      const widget = star.closest("[data-rating-widget]");
      const whole = Number(star.dataset.ratingStar);
      const rect = star.getBoundingClientRect();
      const value = event.detail === 0 || event.clientX - rect.left >= rect.width / 2 ? whole : whole - 0.5;
      persist(widget.dataset.recipeId, { rating: value });
      return;
    }
    const clear = event.target.closest("[data-clear-rating]");
    if (clear) persist(clear.closest("[data-rating-widget]").dataset.recipeId, { rating: 0 });
  });

  document.addEventListener("keydown", event => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const widget = event.target.closest("[data-rating-widget]");
    if (!widget) return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 0.5 : -0.5;
    persist(widget.dataset.recipeId, { rating: Number(widget.dataset.currentRating || 0) + direction });
  });

  if (!clientFactory) {
    message("Household sync could not load. Ratings remain available on this device.", "error");
    return;
  }
  state.db = clientFactory(projectUrl, publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  state.db.auth.getSession().then(({ data, error }) => {
    if (error) throw error;
    return loadHouseholdPreferences(data.session);
  }).catch(() => message("Household preferences could not load. Ratings remain available on this device.", "error"));
})();
