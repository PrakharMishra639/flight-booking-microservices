import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  searchParams: {
    source: '',
    destination: '',
    date: '',
    returnDate: '',
    tripType: 'one-way', // 'one-way' or 'round-trip'
    passengers: 1,
    travelClass: 'ECONOMY',
    stops: 3,
    airlines: [],
    sortBy: 'price_asc',
    searchPhase: 'outward', // 'outward' or 'return'
  },
  searchResults: [],
  returnResults: [],
  availableFilters: {
    airlines: [],
    priceRange: { min: 0, max: 0 },
    timeRanges: { earliest: 0, latest: 0 }
  },
  availablePrices: {},
  returnPrices: {},
  loading: false,
  error: null,
};

const getFilters = async (source, destination, date) => {
  const response = await axiosInstance.get('/search/filters', { params: { source, destination, date } });
  return response.data;
};

const getDatePrices = async (source, destination, startDate, endDate) => {
  const response = await axiosInstance.get('/search/prices', { params: { source, destination, startDate, endDate } });
  return response.data;
};

const flightSlice = createSlice({
  name: 'flight',
  initialState,
  reducers: {
    setSearchParams: (state, action) => {
      state.searchParams = { ...state.searchParams, ...action.payload };
    },
    setSearchResults: (state, action) => {
      state.searchResults = action.payload;
    },
    setReturnResults: (state, action) => {
      state.returnResults = action.payload;
    },
    setAvailableFilters: (state, action) => {
      state.availableFilters = action.payload;
    },
    setAvailablePrices: (state, action) => {
      state.availablePrices = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearSearch: (state) => {
      state.searchResults = [];
      state.availablePrices = {};
      state.returnPrices = {};
      state.error = null;
      state.searchPhase = 'outward';
    },
    setReturnPrices: (state, action) => {
      state.returnPrices = action.payload;
    },
    setSearchPhase: (state, action) => {
      state.searchPhase = action.payload;
    }
  },
});

export const { 
  setSearchParams, 
  setSearchResults, 
  setReturnResults,
  setAvailableFilters, 
  setAvailablePrices,
  setLoading, 
  setError, 
  clearSearch,
  setSearchPhase,
  setReturnPrices
} = flightSlice.actions;
export default flightSlice.reducer;
