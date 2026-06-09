export function getInitials(name: string): string {
    const split = name.split(" ");
    return split[0].charAt(0) + split[1].charAt(0);
}