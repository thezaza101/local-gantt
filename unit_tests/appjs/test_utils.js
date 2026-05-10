describe('Utils & Helpers (UI/App)', () => {

    test('String trimming and sorting works as expected', () => {
        const input = [' beta ', 'alpha', ' gamma'];
        const result = input.map(s => s.trim()).sort((a, b) => a.localeCompare(b));

        assertEqual(result.length, 3);
        assertEqual(result[0], 'alpha');
        assertEqual(result[1], 'beta');
        assertEqual(result[2], 'gamma');
    });

    test('Date string comparison (Performance Optimization check)', () => {
        // Memory states that lexicographical string comparison of YYYY-MM-DD is faster
        // and preferred over Date object instantiation. Let's verify standard JS string comparison works correctly.
        const dateA = '2023-01-01';
        const dateB = '2023-01-02';
        const dateC = '2023-02-01';

        assertTrue(dateA < dateB, 'Jan 1 should be before Jan 2');
        assertTrue(dateB < dateC, 'Jan 2 should be before Feb 1');
        assertFalse(dateC < dateA, 'Feb 1 should not be before Jan 1');
    });

    test.skip('This is an example of a skipped test', () => {
        // This won't run
        assertEqual(true, false);
    });

    test('Async test example', async () => {
        const result = await new Promise(resolve => setTimeout(() => resolve('done'), 100));
        assertEqual(result, 'done');
    });
});
