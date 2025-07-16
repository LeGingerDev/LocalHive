import { NavigationContainer } from "@react-navigation/native"
import { render, fireEvent } from "@testing-library/react-native"

import { ItemCard } from "./ItemCard"
import { ThemeProvider } from "../theme/context"
import { ItemWithProfile } from "../services/supabase/itemService"

// Mock the ItemService
jest.mock("../services/supabase/itemService", () => ({
  ItemService: {
    deleteItem: jest.fn(),
  },
}))

const mockItem: ItemWithProfile = {
  id: "test-item-id",
  group_id: "test-group-id",
  user_id: "test-user-id",
  title: "Test Item",
  category: "electronics",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  full_name: "Test User",
  email: "test@example.com",
}

describe("ItemCard", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should render the component with item data", () => {
    const { getByText } = render(
      <ThemeProvider>
        <NavigationContainer>
          <ItemCard item={mockItem} />
        </NavigationContainer>
      </ThemeProvider>,
    )
    
    expect(getByText("Test Item")).toBeDefined()
    expect(getByText("electronics")).toBeDefined()
    expect(getByText("Test User")).toBeDefined()
  })

  it("should show delete confirmation dialog on long press", () => {
    const { getByText, queryByText } = render(
      <ThemeProvider>
        <NavigationContainer>
          <ItemCard item={mockItem} />
        </NavigationContainer>
      </ThemeProvider>,
    )
    
    // Initially, delete dialog should not be visible
    expect(queryByText("Delete Item")).toBeNull()
    
    // Find the TouchableOpacity and trigger long press
    const itemCard = getByText("Test Item").parent?.parent
    if (itemCard) {
      fireEvent(itemCard, "longPress")
    }
    
    // After long press, delete dialog should be visible
    expect(getByText("Delete Item")).toBeDefined()
    expect(getByText('Are you sure you want to delete "Test Item"? This action cannot be undone.')).toBeDefined()
    expect(getByText("Cancel")).toBeDefined()
    expect(getByText("Delete")).toBeDefined()
  })

  it("should call onItemDeleted callback when delete is confirmed", async () => {
    const mockOnItemDeleted = jest.fn()
    const { getByText } = render(
      <ThemeProvider>
        <NavigationContainer>
          <ItemCard item={mockItem} onItemDeleted={mockOnItemDeleted} />
        </NavigationContainer>
      </ThemeProvider>,
    )
    
    // Trigger long press to show delete dialog
    const itemCard = getByText("Test Item").parent?.parent
    if (itemCard) {
      fireEvent(itemCard, "longPress")
    }
    
    // Click the Delete button
    const deleteButton = getByText("Delete")
    fireEvent.press(deleteButton)
    
    // The onItemDeleted callback should be called
    expect(mockOnItemDeleted).toHaveBeenCalledWith("test-item-id")
  })

  it("should close delete dialog when cancel is pressed", () => {
    const { getByText, queryByText } = render(
      <ThemeProvider>
        <NavigationContainer>
          <ItemCard item={mockItem} />
        </NavigationContainer>
      </ThemeProvider>,
    )
    
    // Trigger long press to show delete dialog
    const itemCard = getByText("Test Item").parent?.parent
    if (itemCard) {
      fireEvent(itemCard, "longPress")
    }
    
    // Verify dialog is visible
    expect(getByText("Delete Item")).toBeDefined()
    
    // Click the Cancel button
    const cancelButton = getByText("Cancel")
    fireEvent.press(cancelButton)
    
    // Dialog should be hidden
    expect(queryByText("Delete Item")).toBeNull()
  })
}) 