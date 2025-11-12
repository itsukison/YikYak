React Native has grown in popularity as a mobile application development tool because of its ability to create cross-platform applications using familiar JavaScript and React principles.

When building mobile applications, one common requirement is the ability to save data locally on the device. This is when local storage comes into play. Async Storage, provided by React Native Expo, is a simple but powerful solution for saving data locally within your React Native Expo apps.

In this tutorial, we'll discuss the fundamentals of local storage, introduce Async Storage, and demonstrate how to properly integrate it into React Native Expo projects.

Table of Contents
Prerequisites
What is Local Storage?
What is Async Storage?
How to Get Started with Async Storage
Understanding Async Storage Methods
Advanced Usage and Best Practices
Conclusion
Prerequisites
Familiarity with React Native and JavaScript.
Node.js and npm (or yarn) installed.
What is Local Storage?
Local storage is an essential component of mobile app development, allowing developers to store data on the user's device. Unlike other storage choices such as databases, Local Storage uses a straightforward key-value pair storage technique.

Developers can use it to save small quantities of data that remain stored even when they close the program or restart the device. This makes it excellent for storing user preferences, authentication tokens, and other important information.

Local storage is essential for boosting app speed because it eliminates the need to retrieve data from faraway servers regularly.

What is Async Storage?
Async Storage is a key-value storage system supplied by React Native Expo that allows you to manage local storage in mobile apps. It provides a simple key-value storage system that enables developers to store and retrieve data asynchronously.

Unlike synchronous storage methods, Async Storage allows you to save and retrieve data without interrupting the main thread, resulting in a more seamless user experience.

How to Get Started with Async Storage
To use Async Storage in your React Native Expo project, ensure that Expo is installed. If you haven't already set up a React Native Expo project, you can do so by installing Expo CLI:

$ npm install -g expo-cli
Create a new Expo project:

$ expo init MyProject
$ cd MyProject
To add Async Storage to your project, run the following command:

$ expo install @react-native-async-storage/async-storage
The @react-native-async-storage/async-storage is a community-maintained version of AsyncStorage. Once installed, you can then setup a file to handle the AsyncStorage methods such as setItem(), updateItem(), deleteItem(), and others. This file would be imported whenever you want to make a call to the local storage.

In this example, we'll create a folder named utils in the root path of our project and then create the AsyncStorage.js file to handle these methods:

Async Storage File Structure Async Storage File Structure

Within the AsyncStorage.js file, you can define the AsyncStorage methods like this:

// utils/AsyncStorage.js

import AsyncStorage from '@react-native-async-storage/async-storage';

export const setItem = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error setting item:', error);
  }
};

export const getItem = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value != null ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Error getting item:', error);
    return null;
  }
};

export const removeItem = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing item:', error);
  }
};

export const mergeItem = async (key, value) => {
  try {
    await AsyncStorage.mergeItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error merging item:', error);
  }
};

export const clear = async () => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing AsyncStorage:', error);
  }
};

export const getAllKeys = async () => {
  try {
    return await AsyncStorage.getAllKeys();
  } catch (error) {
    console.error('Error getting all keys:', error);
    return [];
  }
};

export const getAllItems = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const items = await AsyncStorage.multiGet(keys);
    return items.reduce((accumulator, [key, value]) => {
      accumulator[key] = JSON.parse(value);
      return accumulator;
    }, {});
  } catch (error) {
    console.error('Error getting all items:', error);
    return {};
  }
};
Moving forward, In the next section, we'll explain and break down the meaning of these AsyncStorage functions in the AsyncStorage.js file.

Understanding Async Storage Methods
By separating AsyncStorage functions into their own file, you can conveniently manage and reuse them throughout your React Native Expo project. This modular approach improves code maintenance and readability.

In the previous section, we created the AsyncStorage.js file and added several functions.

In the following sections, we'll talk about these methods and how to use them effectively.

setItem()
This method is essential for storing data locally on the device. It allows developers to store key-value pairs in AsyncStorage, where the key serves as a unique identifier and the value represents the data to be stored.

await AsyncStorage.setItem('username', 'freeCodeCamp');
getItem()
The getItem() method returns the value associated with a given key from local storage. It sends a parameter/key, which is the unique identification of the data being requested. And it returns the value associated with the supplied key, or null if no value is discovered for the given key.

const username = await AsyncStorage.getItem('username');
In this scenario, the value for the key username is fetched from local storage. This obtained value, freeCodeCamp, is then placed in the variable username, making it available for further use across the application.

removeItem()
This function deletes the object with the supplied key from local storage. It's useful when you want to remove a specific piece of data that's no longer required.

await AsyncStorage.removeItem('username');
In this example, the object identified by the key username is removed from local storage.

mergeItem()
The mergeItem() method combines the value of an existing key with the value supplied as input. If the key do not exists, it works similarly to setItem(), creating a new key-value pair.

await AsyncStorage.mergeItem('user', JSON.stringify({ name: 'John' }));
clear()
The clear() method deletes all items from local storage. It's useful when you wish to delete all local data, such as when you log out of a user or reset the application state.

await AsyncStorage.clear();
getAllKeys()
The getAllKeys() function returns all keys kept in local storage. It's useful when you need to loop through all keys or conduct operations based on the keys in local storage.

const keys = await AsyncStorage.getAllKeys();
multiGet()
The multiGet() function obtains several key-value pairs from local storage using an array of keys provided.

const data = await AsyncStorage.multiGet(['username', 'email']);
In this example, the values for the keys username and email are fetched from local storage.

Advanced Usage and Best Practices
While AsyncStorage provides a straightforward interface for local storage, there are several best practices to consider:

Data Serialization: When storing complex data types such as objects or arrays, remember to serialize them into a string format using JSON.stringify() before storing and deserialize them using JSON.parse() when retrieving.
Error Handling: Implement robust error handling to gracefully handle any failures that may occur during Async Storage operations.
Security Considerations: Be mindful of the sensitivity of the data being stored locally and implement appropriate security measures such as encryption for sensitive information.
Conclusion
In conclusion, using local storage into your React Native Expo projects is essential for developing robust and responsive mobile applications. Async Storage simplifies the process of storing and retrieving data on the device, providing a consistent user experience and enabling offline functionalities.

By following the steps provided in this article, you can utilize Async Storage to improve your apps local storage functionality.

Remember, if you have any questions or just want to say hi, feel free to reach me on X(Twitter) or my website. :)