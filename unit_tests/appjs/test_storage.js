describe('Storage Engine (storage.js)', () => {

    test('validateFile requires meta and plans', () => {
        // Missing both
        const invalidData1 = {};
        assertFalse(Storage.validateFile(invalidData1));

        // Missing plans
        const invalidData2 = {
            meta: { fileVersion: "1.0.0" }
        };
        assertFalse(Storage.validateFile(invalidData2));

        // Missing meta
        const invalidData3 = {
            plans: []
        };
        assertFalse(Storage.validateFile(invalidData3));

        // Valid
        const validData = {
            meta: { fileVersion: "1.0.0" },
            plans: []
        };
        assertTrue(Storage.validateFile(validData));
    });

});
