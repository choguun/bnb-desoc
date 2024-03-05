/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';

const useHandle = () => {
  const [handle, setHandle] = useState("");
  const [currentAddress, setCurrentAddress] = useState("");

  const saveHandle = (newReturns: any) => {
    localStorage.setItem('handle', newReturns);
  };

  const saveCurrentAddress = (newAddress: any) => {
    localStorage.setItem('currentAddress', newAddress);
  };

  useEffect(() => {
    const storedHandle = localStorage.getItem('handle');
    const storedCurrentAddress = localStorage.getItem('currentAddress');

    if (storedHandle) {
        setHandle(storedHandle);
    }
    if (storedCurrentAddress) {
        setCurrentAddress(storedCurrentAddress);
    }
  }, []);

  return {
    handle,
    saveHandle,
    currentAddress,
    saveCurrentAddress
  };
}

export default useHandle;