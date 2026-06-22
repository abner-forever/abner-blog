import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getEffectiveLocale, setStoredLocale, type SupportedLocale } from "@/locales";

interface LocaleState {
  locale: SupportedLocale;
}

const initialState: LocaleState = {
  locale: getEffectiveLocale(),
};

const localeSlice = createSlice({
  name: "locale",
  initialState,
  reducers: {
    setLocale: (state, action: PayloadAction<SupportedLocale>) => {
      state.locale = action.payload;
      setStoredLocale(action.payload);
    },
  },
});

export const { setLocale } = localeSlice.actions;
export default localeSlice.reducer;
