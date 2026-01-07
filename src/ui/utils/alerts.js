import { Alert } from "react-native";

/**
 * Shared alert utilities for consistent user confirmations and notifications
 *
 * These functions standardize Alert.alert usage across the app,
 * ensuring consistent messaging patterns and reducing code duplication.
 */

/**
 * Show a standard confirmation alert with Cancel and Confirm buttons
 *
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @param {Function} onConfirm - Callback when user confirms
 * @param {Object} t - Translation function (optional, for i18n)
 * @param {string} confirmText - Custom confirm button text (default: "Confirm")
 * @param {string} cancelText - Custom cancel button text (default: "Cancel")
 *
 * @example
 * showConfirmationAlert(
 *   "Delete Post",
 *   "Are you sure you want to delete this post?",
 *   handleDelete,
 *   t
 * );
 */
export function showConfirmationAlert(
  title,
  message,
  onConfirm,
  t = null,
  confirmText = null,
  cancelText = null
) {
  Alert.alert(
    title,
    message,
    [
      {
        text: cancelText || (t ? t("general.cancel") : "Cancel"),
        style: "cancel",
      },
      {
        text: confirmText || (t ? t("general.confirm") : "Confirm"),
        onPress: onConfirm,
      },
    ],
    { cancelable: true }
  );
}

/**
 * Show a destructive confirmation alert (e.g., delete, block)
 * Uses red/destructive button style
 *
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @param {Function} onConfirm - Callback when user confirms
 * @param {Object} t - Translation function (optional, for i18n)
 * @param {string} confirmText - Custom confirm button text (default: "Delete" or "Confirm")
 * @param {string} cancelText - Custom cancel button text (default: "Cancel")
 *
 * @example
 * showDestructiveAlert(
 *   "Block User",
 *   "You will no longer see posts from this user",
 *   handleBlock,
 *   t,
 *   "Block"
 * );
 */
export function showDestructiveAlert(
  title,
  message,
  onConfirm,
  t = null,
  confirmText = null,
  cancelText = null
) {
  Alert.alert(
    title,
    message,
    [
      {
        text: cancelText || (t ? t("general.cancel") : "Cancel"),
        style: "cancel",
      },
      {
        text: confirmText || (t ? t("general.delete") : "Confirm"),
        style: "destructive",
        onPress: onConfirm,
      },
    ],
    { cancelable: true }
  );
}

/**
 * Show a simple success notification alert
 *
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @param {Object} t - Translation function (optional, for i18n)
 * @param {Function} onDismiss - Optional callback when dismissed
 *
 * @example
 * showSuccessAlert(
 *   "Success",
 *   "Your post has been published",
 *   t
 * );
 */
export function showSuccessAlert(title, message, t = null, onDismiss = null) {
  Alert.alert(
    title,
    message,
    [
      {
        text: t ? t("general.ok") : "OK",
        onPress: onDismiss,
      },
    ],
    { cancelable: true, onDismiss }
  );
}

/**
 * Show a simple error alert
 *
 * @param {string|Error} error - Error object or error message string
 * @param {Object} t - Translation function (optional, for i18n)
 * @param {string} customTitle - Custom title (default: "Error")
 * @param {Function} onDismiss - Optional callback when dismissed
 *
 * @example
 * showErrorAlert(error, t);
 * // or
 * showErrorAlert("Something went wrong", t, "Upload Failed");
 */
export function showErrorAlert(
  error,
  t = null,
  customTitle = null,
  onDismiss = null
) {
  const title = customTitle || (t ? t("general.error") : "Error");
  const message =
    typeof error === "string"
      ? error
      : error?.message || (t ? t("general.error_occurred") : "An error occurred");

  Alert.alert(
    title,
    message,
    [
      {
        text: t ? t("general.ok") : "OK",
        onPress: onDismiss,
      },
    ],
    { cancelable: true, onDismiss }
  );
}

/**
 * Show a custom alert with multiple options
 *
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @param {Array} buttons - Array of button configurations
 * @param {Object} options - Additional alert options
 *
 * @example
 * showCustomAlert(
 *   "Choose Action",
 *   "What would you like to do?",
 *   [
 *     { text: "Edit", onPress: handleEdit },
 *     { text: "Delete", onPress: handleDelete, style: "destructive" },
 *     { text: "Cancel", style: "cancel" }
 *   ]
 * );
 */
export function showCustomAlert(title, message, buttons, options = {}) {
  Alert.alert(title, message, buttons, { cancelable: true, ...options });
}

/**
 * Show a prompt-style alert (with text input on iOS)
 * Note: This only works on iOS. On Android, consider using a custom modal.
 *
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @param {Function} onSubmit - Callback with input text when submitted
 * @param {Object} t - Translation function (optional, for i18n)
 * @param {string} placeholder - Input placeholder text
 * @param {string} defaultValue - Default input value
 *
 * @example
 * showPromptAlert(
 *   "Enter Reason",
 *   "Please provide a reason for reporting",
 *   (text) => handleReport(text),
 *   t,
 *   "Type here..."
 * );
 */
export function showPromptAlert(
  title,
  message,
  onSubmit,
  t = null,
  placeholder = "",
  defaultValue = ""
) {
  Alert.prompt(
    title,
    message,
    [
      {
        text: t ? t("general.cancel") : "Cancel",
        style: "cancel",
      },
      {
        text: t ? t("general.submit") : "Submit",
        onPress: onSubmit,
      },
    ],
    "plain-text",
    defaultValue,
    undefined,
    { placeholder }
  );
}

/**
 * Show an alert asking for user confirmation before performing an async action
 * Handles loading states and errors automatically
 *
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @param {Function} asyncAction - Async function to execute on confirm
 * @param {Object} t - Translation function (optional, for i18n)
 * @param {string} confirmText - Custom confirm button text
 * @param {boolean} destructive - Whether to show destructive styling
 *
 * @example
 * await showAsyncConfirmationAlert(
 *   "Delete Post",
 *   "This action cannot be undone",
 *   async () => {
 *     await deletePost(postId);
 *   },
 *   t,
 *   "Delete",
 *   true
 * );
 */
export async function showAsyncConfirmationAlert(
  title,
  message,
  asyncAction,
  t = null,
  confirmText = null,
  destructive = false
) {
  return new Promise((resolve) => {
    const buttons = [
      {
        text: t ? t("general.cancel") : "Cancel",
        style: "cancel",
        onPress: () => resolve(false),
      },
      {
        text: confirmText || (t ? t("general.confirm") : "Confirm"),
        style: destructive ? "destructive" : "default",
        onPress: async () => {
          try {
            await asyncAction();
            resolve(true);
          } catch (error) {
            showErrorAlert(error, t);
            resolve(false);
          }
        },
      },
    ];

    Alert.alert(title, message, buttons, {
      cancelable: true,
      onDismiss: () => resolve(false),
    });
  });
}
