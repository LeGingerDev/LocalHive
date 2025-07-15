import { FC, memo } from "react"
import {
  View,
  ViewStyle,
  TextStyle,
  Image,
  TouchableOpacity,
  ImageStyle,
  Modal,
  Pressable,
} from "react-native"

import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import { ItemWithProfile } from "@/services/supabase/itemService"
import { getCategoryColor } from "@/theme/categoryColors"

// #region Types & Interfaces
export interface ItemModalProps {
  /**
   * The item to display in the modal
   */
  item: ItemWithProfile
  
  /**
   * Whether the modal is visible
   */
  visible: boolean
  
  /**
   * Callback when modal is closed
   */
  onClose: () => void
}
// #endregion

// #region Component
/**
 * ItemModal - A modal component for displaying and editing item details
 * 
 * Features:
 * - View and edit item details
 * - Image display
 * - Form validation
 * - Error handling
 * - Responsive design
 * - Inline editing with edit icons
 */
export const ItemModal: FC<ItemModalProps> = memo((props) => {
  // #region Props Destructuring
  const { item, visible, onClose } = props
  // #endregion

  // #region Hooks & Context
  const { themed, themeContext } = useAppTheme()
  // #endregion

  // #region Computed Values
  const imageUrls = item.image_urls ?? []
  const hasImage = imageUrls.length > 0
  const categoryColor = getCategoryColor(item.category, themeContext === "dark")
  // #endregion

  // #region Event Handlers
  const handleClose = () => {
    onClose()
  }
  // #endregion

  // #region Render Methods
  const renderHeader = () => (
    <View style={themed($modalHeader)}>
      <Text style={themed($modalTitle)} text="Item Details" />
      <TouchableOpacity onPress={handleClose} style={themed($closeButton)}>
        <Text style={themed($closeButtonText)} text="✕" />
      </TouchableOpacity>
    </View>
  )

  const renderImage = () => {
    if (!hasImage) return null

    return (
      <View style={themed($modalImageContainer)}>
        <Image
          source={{ uri: imageUrls[0] }}
          style={themed($modalImage)}
          resizeMode="contain"
        />
      </View>
    )
  }

  const renderViewMode = () => (
    <>
      {/* Title */}
      <View style={themed($detailRow)}>
        <Text style={themed($detailLabel)} text="Title" />
        <Text style={themed($detailValue)} text={item.title} />
      </View>

      {/* Category */}
      <View style={themed($detailRow)}>
        <Text style={themed($detailLabel)} text="Category" />
        <View style={[themed($categoryBadge), { backgroundColor: categoryColor }]}>
          <Text style={themed($categoryBadgeText)} text={item.category} />
        </View>
      </View>

      {/* Location */}
      {item.location && (
        <View style={themed($detailRow)}>
          <Text style={themed($detailLabel)} text="Location" />
          <Text style={themed($detailValue)} text={item.location} />
        </View>
      )}

      {/* Notes/Details */}
      {item.details && (
        <View style={themed($detailRow)}>
          <Text style={themed($detailLabel)} text="Notes" />
          <Text style={themed($detailValue)} text={item.details} />
        </View>
      )}

      {/* Added by */}
      <View style={themed($detailRow)}>
        <Text style={themed($detailLabel)} text="Added by" />
        <Text
          style={themed($detailValue)}
          text={item.full_name || item.email || "Unknown user"}
        />
      </View>

      {/* Date */}
      <View style={themed($detailRow)}>
        <Text style={themed($detailLabel)} text="Added on" />
        <Text
          style={themed($detailValue)}
          text={new Date(item.created_at).toLocaleDateString()}
        />
      </View>
    </>
  )
  // #endregion

  // #region Main Render
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={themed($modalOverlay)} onPress={onClose}>
        <View style={themed($modalContainer)}>
          <View style={themed($modalContent)}>
            {renderHeader()}
            {renderImage()}
            <View style={themed($modalDetailsContainer)}>
              {renderViewMode()}
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  )
  // #endregion
})

// Set display name for debugging
ItemModal.displayName = "ItemModal"
// #endregion

// #region Styles
const $modalOverlay = (): ViewStyle => ({
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.7)",
  justifyContent: "center",
  alignItems: "center",
})

const $modalContainer = ({ spacing }: any): ViewStyle => ({
  maxWidth: "90%",
  maxHeight: "85%",
  width: "100%",
})

const $modalContent = ({ colors, spacing }: any): ViewStyle => ({
  backgroundColor: colors.background,
  borderRadius: spacing.lg,
  overflow: "hidden",
  maxHeight: "100%",
})

const $modalHeader = ({ spacing }: any): ViewStyle => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  padding: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: "rgba(0,0,0,0.1)",
})

const $modalTitle = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.bold,
  fontSize: 18,
  color: colors.text,
})

const $closeButton = ({ spacing }: any): ViewStyle => ({
  padding: spacing.xs,
  borderRadius: spacing.xs,
})

const $closeButtonText = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.bold,
  fontSize: 18,
  color: colors.textDim,
})

const $modalImageContainer = ({ spacing }: any): ViewStyle => ({
  height: 300,
  width: 300,
  alignSelf: "center",
  margin: spacing.sm,
  borderRadius: spacing.md,
  overflow: "hidden",
})

const $modalImage = (): ImageStyle => ({
  width: "100%",
  height: "100%",
  borderRadius: 12,
})

const $modalDetailsContainer = ({ spacing }: any): ViewStyle => ({
  padding: spacing.sm,
})

const $detailRow = ({ spacing }: any): ViewStyle => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: spacing.xs,
  paddingVertical: spacing.xxs,
})

const $detailLabel = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: colors.textDim,
  flex: 1,
})

const $detailValue = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  color: colors.text,
  flex: 2,
  textAlign: "right",
})

const $categoryBadge = ({ spacing }: any): ViewStyle => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: spacing.xs,
})

const $categoryBadgeText = ({ typography }: any): TextStyle => ({
  fontFamily: typography.primary.medium,
  fontSize: 12,
  color: "#fff",
  textTransform: "capitalize",
})
// #endregion